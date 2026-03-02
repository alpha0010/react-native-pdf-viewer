package com.alpha0010.pdf

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.util.LruCache
import android.util.Size
import android.util.TypedValue
import android.util.TypedValue.COMPLEX_UNIT_DIP
import android.view.View
import androidx.core.graphics.createBitmap
import androidx.core.graphics.toColorInt
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileNotFoundException
import java.util.concurrent.locks.Lock
import kotlin.concurrent.withLock
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.hypot

enum class ResizeMode(val jsName: String) {
  CONTAIN("contain"),
  FIT_WIDTH("fitWidth")
}

// Canvas passed to onDraw() crashes if passed too large a bitmap. Divide
// rendered bitmap into slices to draw in sequence.
// Logic assumes PdfView is at least `SLICES` pixels tall.
const val SLICES = 8

@SuppressLint("ViewConstructor")
class PdfView(
  context: Context,
  private val measureCache: LruCache<String, Size>,
  private val pdfMutex: Lock
) : View(context) {
  private var mAnnotation = emptyList<AnnotationPage>()
  private val mBitmaps = MutableList(SLICES) { createBitmap(1, 1) }
  private var mDirty = false
  private var mAnnotationDirty = false
  private var mPage = 0
  private var mPageMeasure = Size(1, 1)
  private var mResizeMode = ResizeMode.CONTAIN
  private var mSource = ""
  private var mStateWrapper: StateWrapper? = null
  private val mViewRects = List(SLICES) { Rect() }

  fun setStateWrapper(stateWrapper: StateWrapper?) {
    mStateWrapper = stateWrapper
    measurePdf()
  }

  /**
   * Push sizing info to the shadow node.
   */
  private fun measurePdf() {
    if (mStateWrapper == null) {
      return
    }
    // Attempt to get page dimensions from cache, to avoid disk I/O.
    val cacheKey = "$mPage-$mSource"
    val cachedSize = measureCache[cacheKey]
    if (cachedSize != null) {
      if (cachedSize != mPageMeasure) {
        mPageMeasure = cachedSize
        mStateWrapper?.updateState(Arguments.createMap().apply {
          putInt("width", mPageMeasure.width)
          putInt("height", mPageMeasure.height)
        })
      }
      return
    }

    // It appears that this cannot be pushed to a background thread due to
    // the call to `dirty()`.
    val file = File(mSource)
    val fd = try {
      ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: FileNotFoundException) {
      return
    }
    val pageSize = pdfMutex.withLock {
      val renderer = try {
        PdfRenderer(fd)
      } catch (e: Exception) {
        fd.close()
        return
      }
      val page = try {
        renderer.openPage(mPage)
      } catch (e: Exception) {
        renderer.close()
        fd.close()
        return
      }
      val res = Size(page.width, page.height)
      page.close()
      renderer.close()
      return@withLock res
    }
    fd.close()

    measureCache.put(cacheKey, pageSize)
    if (pageSize != mPageMeasure) {
      mPageMeasure = pageSize
      mStateWrapper?.updateState(Arguments.createMap().apply {
        putInt("width", mPageMeasure.width)
        putInt("height", mPageMeasure.height)
      })
    }
  }

  fun setAnnotation(source: String, file: Boolean) {
    if (source.isEmpty()) {
      if (mAnnotation.isNotEmpty()) {
        mAnnotation = emptyList()
        mAnnotationDirty = true
      }
      return
    }

    try {
      mAnnotation = if (file) {
        Json.decodeFromString(File(source).readText())
      } else {
        Json.decodeFromString(source)
      }
      mAnnotationDirty = true
    } catch (e: Exception) {
      onError("Failed to load annotation from '$source'. ${e.message}")
    }
  }

  fun setPage(page: Int) {
    mPage = page
    mDirty = true
    measurePdf()
  }

  fun setResizeMode(mode: String) {
    val resizeMode = when (mode) {
      ResizeMode.CONTAIN.jsName -> ResizeMode.CONTAIN
      ResizeMode.FIT_WIDTH.jsName -> ResizeMode.FIT_WIDTH
      else -> {
        onError("Unknown resizeMode '$mode'.")
        return
      }
    }

    mResizeMode = resizeMode
    mDirty = true
  }

  fun setSource(source: String) {
    mSource = source
    mDirty = true
    measurePdf()
  }

  private fun computeDestRect(srcWidth: Int, srcHeight: Int): RectF {
    return when (mResizeMode) {
      ResizeMode.CONTAIN -> RectF(0f, 0f, width.toFloat(), height.toFloat())
      ResizeMode.FIT_WIDTH -> {
        val targetHeight = width.toFloat() * srcHeight.toFloat() / srcWidth.toFloat()
        RectF(0f, 0f, width.toFloat(), targetHeight)
      }
    }
  }

  private fun parseColor(hex: String): Int {
    var androidColor = hex
    if (hex.length == 9) {
      // Convert #RRGGBBAA to #AARRGGBB.
      androidColor = "#" + hex.takeLast(2) + hex.drop(1).take(6)
    }
    return try {
      androidColor.toColorInt()
    } catch (e: Exception) {
      Color.BLACK
    }
  }

  private fun computeDist(a: List<Float>, b: List<Float>, scaleX: Int, scaleY: Int): Float {
    return hypot(scaleX * (a[0] - b[0]), scaleY * (a[1] - b[1]))
  }

  private fun computePath(coordinates: List<List<Float>>, scaleX: Int, scaleY: Int): Path {
    return Path().apply {
      // Start path at the first point.
      var prevPoint = coordinates.first()
      moveTo(prevPoint[0] * scaleX, prevPoint[1] * scaleY)
      for (point in coordinates.drop(1)) {
        if (computeDist(prevPoint, point, scaleX, scaleY) < 8) {
          // Smooth small irregularities.
          continue
        }
        val midX = (prevPoint[0] + point[0]) / 2
        val midY = (prevPoint[1] + point[1]) / 2
        // Draw line to the midpoint between the next two points. Use the first
        // point as curve control (line will bend toward it).
        quadTo(
          prevPoint[0] * scaleX, prevPoint[1] * scaleY,
          midX * scaleX, midY * scaleY
        )
        prevPoint = point
      }
      // Draw line to the last point.
      prevPoint = coordinates.last()
      lineTo(prevPoint[0] * scaleX, prevPoint[1] * scaleY)
    }
  }

  private fun renderAnnotation(ctx: Canvas) {
    if (mAnnotation.size <= mPage) {
      // No annotation data for current page.
      return
    }
    val metrics = resources.displayMetrics
    val paint = Paint()

    // Draw strokes.
    paint.isAntiAlias = true
    paint.style = Paint.Style.STROKE
    paint.strokeCap = Paint.Cap.ROUND
    paint.strokeJoin = Paint.Join.ROUND
    for (stroke in mAnnotation[mPage].strokes) {
      if (stroke.path.size < 2) {
        continue
      }
      paint.color = parseColor(stroke.color)
      paint.strokeWidth = TypedValue.applyDimension(COMPLEX_UNIT_DIP, stroke.width, metrics)
      ctx.drawPath(computePath(stroke.path, ctx.width, ctx.height), paint)
    }

    // Draw text.
    paint.reset()
    paint.isAntiAlias = true
    paint.textAlign = Paint.Align.LEFT
    val bounds = Rect()
    val factor = TypedValue.applyDimension(COMPLEX_UNIT_DIP, 1000f, metrics)
    for (msg in mAnnotation[mPage].text) {
      paint.color = parseColor(msg.color)
      // Increase the font for larger views, but do so at a reduced rate.
      val scaledFont = 9 + (msg.fontSize * ctx.width) / factor
      paint.textSize = TypedValue.applyDimension(COMPLEX_UNIT_DIP, scaledFont, metrics)
      paint.getTextBounds(msg.str, 0, msg.str.length, bounds)
      ctx.drawText(
        msg.str,
        ctx.width * msg.point[0],
        ctx.height * msg.point[1] - bounds.top,
        paint
      )
    }
  }

  fun renderPdf() {
    if (height < 1 || width < 1 || mSource.isEmpty()) {
      // View layout not yet complete, or nothing to render.
      return
    }
    if (!mDirty) {
      if (mAnnotationDirty) {
        // Only annotations changed, keep cached pdf render.
        postInvalidate()
      }
      mAnnotationDirty = false
      return
    }

    mDirty = false
    mAnnotationDirty = false

    CoroutineScope(Dispatchers.Main).launch(Dispatchers.IO) {
      val file = File(mSource)
      val fd = try {
        ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
      } catch (e: FileNotFoundException) {
        onError("File '$mSource' not found.")
        return@launch
      }

      val pdfPageWidth: Int
      val pdfPageHeight: Int
      val bitmap = pdfMutex.withLock {
        val renderer = try {
          PdfRenderer(fd)
        } catch (e: Exception) {
          fd.close()
          onError("Failed to open '$mSource' for reading.")
          return@launch
        }
        val pdfPage = try {
          renderer.openPage(mPage)
        } catch (e: Exception) {
          renderer.close()
          fd.close()
          onError("Failed to open page '$mPage' of '$mSource' for reading.")
          return@launch
        }

        pdfPageWidth = pdfPage.width
        pdfPageHeight = pdfPage.height

        // Api requires bitmap have alpha channel; fill with white so rendered
        // bitmap is opaque.
        val rendered = try {
          createBitmap(width, height)
        } catch (e: OutOfMemoryError) {
          pdfPage.close()
          renderer.close()
          fd.close()
          onError("Insufficient memory to render '$mSource' at ${width}x${height}.")
          return@launch
        }
        rendered.eraseColor(Color.WHITE)

        // Scale the pdf page up/down to match the requested render dimensions.
        val transform = if (shouldTransformRender(pdfPageWidth, pdfPageHeight, rendered)) {
          val mtr = Matrix()
          mtr.setRectToRect(
            RectF(0f, 0f, pdfPageWidth.toFloat(), pdfPageHeight.toFloat()),
            computeDestRect(pdfPageWidth, pdfPageHeight),
            Matrix.ScaleToFit.CENTER
          )
          mtr
        } else {
          null
        }

        pdfPage.render(rendered, null, transform, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

        pdfPage.close()
        renderer.close()

        return@withLock rendered
      }
      fd.close()

      withContext(Dispatchers.Main) {
        // Post new bitmap for display.
        val sliceHeight = floor(bitmap.height.toFloat() / SLICES).toInt()
        if (sliceHeight < 1) {
          return@withContext
        }
        for (i in mBitmaps.indices) {
          mBitmaps[i].recycle()
          val remainingHeight = bitmap.height - i * sliceHeight
          if (remainingHeight < 2 * sliceHeight) {
            // Last slice.
            mBitmaps[i] =
              Bitmap.createBitmap(bitmap, 0, i * sliceHeight, bitmap.width, remainingHeight)
          } else {
            mBitmaps[i] = Bitmap.createBitmap(bitmap, 0, i * sliceHeight, bitmap.width, sliceHeight)
          }
        }
        invalidate()
      }
      // TODO: Is `bitmap.recycle()` safe here?

      onLoadComplete(pdfPageWidth, pdfPageHeight)
    }
  }

  private fun shouldTransformRender(sourceWidth: Int, sourceHeight: Int, bmp: Bitmap): Boolean {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      return true
    }

    // On lower API levels, using a transform matrix can cause incorrect
    // rendering if the page is rotated or cropped.
    // Check if transform is actually needed.
    val aspectRatio = sourceWidth.toFloat() / sourceHeight.toFloat()
    val targetWidth = bmp.height * aspectRatio
    val delta = abs(bmp.width - targetWidth)
    // Transform if error is greater than 4 pixels.
    return delta > 4
  }

  private fun onError(message: String) {
    val reactContext = context as ReactContext
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)?.dispatchEvent(
      OnErrorEvent(UIManagerHelper.getSurfaceId(reactContext), id, message)
    )
  }

  inner class OnErrorEvent(surfaceId: Int, viewId: Int, message: String) :
    Event<OnErrorEvent>(surfaceId, viewId) {
    private val payload = Arguments.createMap().apply { putString("message", message) }
    override fun getEventName() = "onPdfError"
    override fun getEventData() = payload
  }

  private fun onLoadComplete(pageWidth: Int, pageHeight: Int) {
    val reactContext = context as ReactContext
    UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)?.dispatchEvent(
      OnLoadCompleteEvent(UIManagerHelper.getSurfaceId(reactContext), id, pageWidth, pageHeight)
    )
  }

  inner class OnLoadCompleteEvent(surfaceId: Int, viewId: Int, width: Int, height: Int) :
    Event<OnLoadCompleteEvent>(surfaceId, viewId) {
    private val payload = Arguments.createMap().apply {
      putInt("width", width)
      putInt("height", height)
    }

    override fun getEventName() = "onPdfLoadComplete"
    override fun getEventData() = payload
  }

  override fun onDraw(canvas: Canvas) {
    mBitmaps.zip(mViewRects) { bitmap, viewRect ->
      if (!viewRect.isEmpty) {
        canvas.drawBitmap(bitmap, null, viewRect, null)
      }
    }
    renderAnnotation(canvas)
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    val sliceHeight = floor(h.toFloat() / SLICES).toInt()
    if (sliceHeight < 1) {
      return
    }
    for (i in mViewRects.indices) {
      val remainingHeight = h - i * sliceHeight
      if (remainingHeight < 2 * sliceHeight) {
        // Last slice.
        mViewRects[i].set(0, i * sliceHeight, w, i * sliceHeight + remainingHeight)
      } else {
        mViewRects[i].set(0, i * sliceHeight, w, (i + 1) * sliceHeight)
      }
    }
    mDirty = true
    renderPdf()
  }
}
