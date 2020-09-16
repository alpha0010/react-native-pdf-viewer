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
  private var mPageHeight: Float = 1f
  private var mPageWidth: Float = 1f

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
  @ReactProp(name = "src")
  fun setSrc(source: String?) {
    if (source == null) {
      return
    }

    val file = File(source)
    val fd: ParcelFileDescriptor
    try {
      fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: FileNotFoundException) {
      return
    }
    val renderer = PdfRenderer(fd)
    val page = renderer.openPage(0)
    mPageHeight = page.height.toFloat()
    mPageWidth = page.width.toFloat()
    page.close()
    renderer.close()
    fd.close()

    dirty()
  }
}
