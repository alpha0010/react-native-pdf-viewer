package com.alpha0010

import android.os.Build
import android.util.LruCache
import android.util.Size
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class PdfViewManager : BaseViewManager<PdfView, PdfViewShadowNode>() {
  private val mMeasureCache = LruCache<String, Size>(128)

  override fun getName(): String {
    return "RNPdfView"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): PdfView {
    return PdfView(reactContext)
  }

  override fun createShadowNodeInstance(): PdfViewShadowNode {
    return PdfViewShadowNode(mMeasureCache)
  }

  override fun getShadowNodeClass(): Class<out PdfViewShadowNode> {
    return PdfViewShadowNode::class.java
  }

  override fun updateExtraData(root: PdfView, extraData: Any?) {}

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  @ReactProp(name = "page", defaultInt = 0)
  fun setPage(view: PdfView, page: Int) {
    view.setPage(page)
  }

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  @ReactProp(name = "source")
  fun setSource(view: PdfView, source: String?) {
    view.setSource(source ?: "")
  }
}
