package com.alpha0010

import android.graphics.pdf.PdfRenderer
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.facebook.yoga.YogaNode
import java.io.File
import java.io.FileNotFoundException

class PdfViewShadowNode : LayoutShadowNode(), YogaMeasureFunction {
  private var mPage = 0
  private var mPageHeight = 1f
  private var mPageWidth = 1f
  private var mSource = ""

  init {
    setMeasureFunction(this)
  }

  override fun measure(node: YogaNode, width: Float, widthMode: YogaMeasureMode, height: Float, heightMode: YogaMeasureMode): Long {
    val aspectRatio = mPageWidth / mPageHeight
    val targetWidth = height * aspectRatio
    if (widthMode == YogaMeasureMode.UNDEFINED || width < 1) {
      if (heightMode == YogaMeasureMode.UNDEFINED || height < 1) {
        return YogaMeasureOutput.make(mPageWidth, mPageHeight)
      }
      return YogaMeasureOutput.make(targetWidth, height)
    }

    if (targetWidth <= width) {
      return YogaMeasureOutput.make(targetWidth, height)
    }
    return YogaMeasureOutput.make(width, width / aspectRatio)
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  private fun measurePdf() {
    val file = File(mSource)
    val fd = try {
      ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: FileNotFoundException) {
      return
    }
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
    mPageHeight = page.height.toFloat()
    mPageWidth = page.width.toFloat()
    page.close()
    renderer.close()
    fd.close()

    dirty()
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  @ReactProp(name = "page", defaultInt = 0)
  fun setPage(page: Int) {
    if (mPage != page) {
      mPage = page
      measurePdf()
    }
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  @ReactProp(name = "source")
  fun setSource(source: String?) {
    if (source != null && mSource != source) {
      mSource = source
      measurePdf()
    }
  }
}
