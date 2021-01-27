package com.alpha0010.pdf

import android.util.LruCache
import android.util.Size
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import java.util.concurrent.locks.Lock

class PdfViewManager(private val pdfMutex: Lock) : BaseViewManager<PdfView, PdfViewShadowNode>() {
  private val mMeasureCache = LruCache<String, Size>(128)

  override fun getName(): String {
    return "RNPdfView"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): PdfView {
    return PdfView(reactContext, pdfMutex)
  }

  override fun createShadowNodeInstance(): PdfViewShadowNode {
    return PdfViewShadowNode(mMeasureCache, pdfMutex)
  }

  override fun getShadowNodeClass(): Class<out PdfViewShadowNode> {
    return PdfViewShadowNode::class.java
  }

  override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      "onPdfError" to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to "onPdfError")
      ),
      "onPdfLoadComplete" to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to "onPdfLoadComplete")
      )
    )
  }

  override fun updateExtraData(root: PdfView, extraData: Any?) {}

  /**
   * Page (0-indexed) of document to display.
   */
  @ReactProp(name = "page", defaultInt = 0)
  fun setPage(view: PdfView, page: Int) {
    view.setPage(page)
  }

  /**
   * How pdf page should be scaled to fit in view dimensions.
   *
   * `contain`
   *   - Center and scale to the largest size that does not crop content.
   * `fitWidth`
   *   - Scale pdf page so width matches view. If aspect ratio of the pdf
   *     does not match the view, content will be cropped/space buffered at
   *     the bottom.
   */
  @ReactProp(name = "resizeMode")
  fun setResizeMode(view: PdfView, mode: String?) {
    view.setResizeMode(mode ?: ResizeMode.CONTAIN.jsName)
  }

  /**
   * Document to display.
   */
  @ReactProp(name = "source")
  fun setSource(view: PdfView, source: String?) {
    view.setSource(source ?: "")
  }
}
