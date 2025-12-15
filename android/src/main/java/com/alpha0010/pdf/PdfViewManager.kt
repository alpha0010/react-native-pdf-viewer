package com.alpha0010.pdf

import android.util.LruCache
import android.util.Size
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.PdfViewManagerDelegate
import com.facebook.react.viewmanagers.PdfViewManagerInterface
import java.util.concurrent.locks.Lock

@ReactModule(name = PdfViewManager.NAME)
class PdfViewManager(private val pdfMutex: Lock) : SimpleViewManager<PdfView>(),
  PdfViewManagerInterface<PdfView> {
  private val mDelegate: ViewManagerDelegate<PdfView> = PdfViewManagerDelegate(this)
  private val mMeasureCache = LruCache<String, Size>(128)

  override fun getDelegate() = mDelegate

  override fun getName() = NAME

  public override fun createViewInstance(context: ThemedReactContext) =
    PdfView(context, mMeasureCache, pdfMutex)

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

  override fun onAfterUpdateTransaction(view: PdfView) {
    super.onAfterUpdateTransaction(view)
    view.renderPdf()
  }

  override fun updateState(
    view: PdfView,
    props: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?
  ): Any? {
    view.setStateWrapper(stateWrapper)
    return super.updateState(view, props, stateWrapper)
  }

  /**
   * Set annotation from file containing a PAS v1 JSON string
   */
  @ReactProp(name = "annotation")
  override fun setAnnotation(view: PdfView, source: String?) =
    view.setAnnotation(source ?: "", file = true)

  /**
   * Set annotation from a PAS v1 JSON string
   */
  @ReactProp(name = "annotationStr")
  override fun setAnnotationStr(view: PdfView, source: String?) =
    view.setAnnotation(source ?: "", file = false)

  /**
   * Page (0-indexed) of document to display.
   */
  @ReactProp(name = "page")
  override fun setPage(view: PdfView, page: Int) = view.setPage(page)

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
  override fun setResizeMode(view: PdfView, mode: String?) =
    view.setResizeMode(mode ?: ResizeMode.CONTAIN.jsName)

  /**
   * Document to display.
   */
  @ReactProp(name = "source")
  override fun setSource(view: PdfView, source: String?) = view.setSource(source ?: "")

  companion object {
    const val NAME = "PdfView"
  }
}
