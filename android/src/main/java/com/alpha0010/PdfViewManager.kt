package com.alpha0010

import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class PdfViewManager : BaseViewManager<PdfView, PdfViewShadowNode>() {
  override fun getName(): String {
    return "RNPdfView"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): PdfView {
    return PdfView(reactContext)
  }

  override fun createShadowNodeInstance(): PdfViewShadowNode {
    return PdfViewShadowNode()
  }

  override fun getShadowNodeClass(): Class<out PdfViewShadowNode> {
    return PdfViewShadowNode::class.java
  }

  override fun updateExtraData(root: PdfView, extraData: Any?) {}

  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  @ReactProp(name = "src")
  fun setSrc(view: PdfView, source: String?) {
    view.setPdfSource(source ?: "")
  }
}
