package com.alpha0010

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.*
import android.graphics.pdf.PdfRenderer
import android.os.Build
import android.os.ParcelFileDescriptor
import android.view.View
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileNotFoundException
import java.util.concurrent.locks.Lock
import kotlin.concurrent.withLock

enum class ResizeMode(val jsName: String) {
  CONTAIN("contain"),
  FIT_WIDTH("fitWidth")
}

@SuppressLint("ViewConstructor")
class PdfView(context: Context, private val pdfMutex: Lock) : View(context) {
  private var mBitmap: Bitmap
  private var mPage = 0
  private var mResizeMode = ResizeMode.CONTAIN
  private var mSource = ""
  private val mViewRect = Rect()

  init {
    mBitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  fun setPage(page: Int) {
    mPage = page
    renderPdf()
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
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
    renderPdf()
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  fun setSource(source: String) {
    mSource = source
    renderPdf()
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

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  private fun renderPdf() {
    if (height < 1 || width < 1 || mSource.isEmpty()) {
      // View layout not yet complete, or nothing to render.
      return
    }

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

        // Scale the pdf page up/down to match the requested render dimensions.
        val transform = Matrix()
        transform.setRectToRect(
          RectF(0f, 0f, pdfPageWidth.toFloat(), pdfPageHeight.toFloat()),
          computeDestRect(pdfPageWidth, pdfPageHeight),
          Matrix.ScaleToFit.CENTER
        )
        // Api requires bitmap have alpha channel; fill with white so rendered
        // bitmap is opaque.
        val rendered = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        rendered.eraseColor(Color.WHITE)
        pdfPage.render(rendered, null, transform, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

        pdfPage.close()
        renderer.close()

        return@withLock rendered
      }
      fd.close()

      withContext(Dispatchers.Main) {
        // Post new bitmap for display.
        mBitmap.recycle()
        mBitmap = bitmap
        invalidate()
      }

      onLoadComplete(pdfPageWidth, pdfPageHeight)
    }
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

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    mViewRect.set(0, 0, w, h)
    renderPdf()
  }
}
