package com.alpha0010

import android.content.Context
import android.graphics.*
import android.graphics.pdf.PdfRenderer
import android.os.Build
import android.os.ParcelFileDescriptor
import android.view.View
import androidx.annotation.RequiresApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileNotFoundException

class PdfView(context: Context) : View(context) {
  private var mBitmap: Bitmap
  private var mPage = 0
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
  fun setSource(source: String) {
    mSource = source
    renderPdf()
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  private fun renderPdf() {
    if (height < 1 || width < 1 || mSource.isEmpty()) {
      return
    }

    CoroutineScope(Dispatchers.Main).launch(Dispatchers.IO) {
      val file = File(mSource)
      val fd = try {
        ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
      } catch (e: FileNotFoundException) {
        return@launch
      }

      val renderer = PdfRenderer(fd)
      val pdfPage = try {
        renderer.openPage(mPage)
      } catch (e: Exception) {
        renderer.close()
        fd.close()
        return@launch
      }

      val transform = Matrix()
      transform.setRectToRect(
        RectF(0f, 0f, pdfPage.width.toFloat(), pdfPage.height.toFloat()),
        RectF(0f, 0f, width.toFloat(), height.toFloat()),
        Matrix.ScaleToFit.CENTER
      )
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      bitmap.eraseColor(Color.WHITE)
      pdfPage.render(bitmap, null, transform, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)

      withContext(Dispatchers.Main) {
        mBitmap.recycle()
        mBitmap = bitmap
        invalidate()
      }

      pdfPage.close()
      renderer.close()
      fd.close()
    }
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
