package com.alpha0010.pdf

import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.util.LruCache
import android.util.Size
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.yoga.YogaMeasureFunction
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.facebook.yoga.YogaNode
import java.io.File
import java.io.FileNotFoundException
import java.util.concurrent.locks.Lock
import kotlin.concurrent.withLock

class PdfViewShadowNode(measureCache: LruCache<String, Size>, private val pdfMutex: Lock) : LayoutShadowNode(), YogaMeasureFunction {
  private val mMeasureCache = measureCache
  private var mPage = 0
  private var mPageHeight = 1
  private var mPageWidth = 1
  private var mSource = ""

  init {
    setMeasureFunction(this)
  }

  override fun measure(node: YogaNode, width: Float, widthMode: YogaMeasureMode, height: Float, heightMode: YogaMeasureMode): Long {
    val aspectRatio = mPageWidth.toFloat() / mPageHeight.toFloat()
    val targetWidth = height * aspectRatio
    if (widthMode == YogaMeasureMode.UNDEFINED || width < 1) {
      if (heightMode == YogaMeasureMode.UNDEFINED || height < 1) {
        // No restrictions on dimensions? Use pdf dimensions.
        return YogaMeasureOutput.make(mPageWidth, mPageHeight)
      }
      // No width requirements? Scale page to match yoga requested height.
      return YogaMeasureOutput.make(targetWidth, height)
    }

    if (targetWidth <= width) {
      // When scaled to match yoga requested height, page scaled width is
      // within yoga width bounds. Scale page to match yoga requested height.
      return YogaMeasureOutput.make(targetWidth, height)
    }
    // Scale page to match yoga requested width.
    return YogaMeasureOutput.make(width, width / aspectRatio)
  }

  private fun measurePdf() {
    // Attempt to get page dimensions from cache, to avoid disk I/O.
    val cacheKey = "$mPage-$mSource"
    val cachedSize = mMeasureCache[cacheKey]
    if (cachedSize != null) {
      if (mPageHeight != cachedSize.height || mPageWidth != cachedSize.width) {
        mPageHeight = cachedSize.height
        mPageWidth = cachedSize.width
        dirty()
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

    mPageHeight = pageSize.height
    mPageWidth = pageSize.width
    mMeasureCache.put(cacheKey, pageSize)

    dirty()
  }

  /**
   * Page (0-indexed) of document to display.
   */
  @ReactProp(name = "page", defaultInt = 0)
  fun setPage(page: Int) {
    if (mPage != page) {
      mPage = page
      measurePdf()
    }
  }

  /**
   * Document to display.
   */
  @ReactProp(name = "source")
  fun setSource(source: String?) {
    if (source != null && mSource != source) {
      mSource = source
      measurePdf()
    }
  }
}
