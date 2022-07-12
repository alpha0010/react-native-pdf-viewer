package com.alpha0010.pdf

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.*
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.util.TypedValue
import android.util.TypedValue.COMPLEX_UNIT_DIP
import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileNotFoundException
import java.util.concurrent.locks.Lock
import kotlin.concurrent.withLock
import kotlin.math.abs
import kotlin.math.hypot

enum class ResizeMode(val jsName: String) {
  CONTAIN("contain"),
  FIT_WIDTH("fitWidth")
}

@SuppressLint("ViewConstructor")
class PdfView(context: Context, private val pdfMutex: Lock) : View(context) {
  private var mAnnotation = emptyList<AnnotationPage>()
  private var mBitmap: Bitmap
  private var mDirty = false
  private var mPage = 0
  private var mResizeMode = ResizeMode.CONTAIN
  private var mSource = ""
  private val mViewRect = Rect()

  init {
    mBitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
  }

  fun setAnnotation(source: String, file: Boolean = false) {
    if (source.isEmpty()) {
      if (mAnnotation.isNotEmpty()) {
        mAnnotation = emptyList()
        mDirty = true
      }
      return
    }

    try {
      if (file) {
        mAnnotation = Json.decodeFromString(File(source).readText())
      } else {
        mAnnotation = Json.decodeFromString(source);
      }
      mDirty = true
    } catch (e: Exception) {
      onError("Failed to load annotation from '$source'. ${e.message}")
    }
  }

  fun setPage(page: Int) {
    mPage = page
    mDirty = true
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
      Color.parseColor(androidColor)
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

  private fun renderAnnotation(bitmap: Bitmap) {
    if (mAnnotation.size <= mPage) {
      // No annotation data for current page.
      return
    }
    val metrics = resources.displayMetrics
    val ctx = Canvas(bitmap)
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
      ctx.drawPath(computePath(stroke.path, bitmap.width, bitmap.height), paint)
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
      val scaledFont = 9 + (msg.fontSize * bitmap.width) / factor
      paint.textSize = TypedValue.applyDimension(COMPLEX_UNIT_DIP, scaledFont, metrics)
      paint.getTextBounds(msg.str, 0, msg.str.length, bounds)
      ctx.drawText(
        msg.str,
        bitmap.width * msg.point[0],
        bitmap.height * msg.point[1] - bounds.top,
        paint
      )
    }
  }

  fun renderPdf() {
    if (height < 1 || width < 1 || mSource.isEmpty() || !mDirty) {
      // View layout not yet complete, or nothing to render.
      return
    }
    mDirty = false

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
          Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
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

      renderAnnotation(bitmap)

      withContext(Dispatchers.Main) {
        // Post new bitmap for display.
        mBitmap.recycle()
        mBitmap = bitmap
        invalidate()
      }

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
    val event = Arguments.createMap()
    event.putString("message", message)
    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(
      id, "onPdfError", event
    )
  }

  private fun onLoadComplete(pageWidth: Int, pageHeight: Int) {
    val event = Arguments.createMap()
    event.putInt("width", pageWidth)
    event.putInt("height", pageHeight)
    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(
      id, "onPdfLoadComplete", event
    )
  }

  override fun onDraw(canvas: Canvas) {
    if (!mViewRect.isEmpty) {
      canvas.drawBitmap(mBitmap, null, mViewRect, null)
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    mViewRect.set(0, 0, w, h)
    mDirty = true
    renderPdf()
  }
}
