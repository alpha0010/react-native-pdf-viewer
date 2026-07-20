package com.alpha0010.pdf

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.concurrent.locks.ReentrantLock

class PdfViewPackage : BaseReactPackage() {
  companion object {
    private val pdfMutex = ReentrantLock()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf(PdfViewManager(pdfMutex))

  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext
  ): NativeModule? {
    return when (name) {
      NativePdfUtilSpec.NAME -> PdfUtilModule(reactContext, pdfMutex)
      PdfViewManager.NAME -> PdfViewManager(pdfMutex)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      NativePdfUtilSpec.NAME to ReactModuleInfo(
        name = NativePdfUtilSpec.NAME,
        className = NativePdfUtilSpec.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true,
      ),
      PdfViewManager.NAME to ReactModuleInfo(
        name = PdfViewManager.NAME,
        className = PdfViewManager.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true,
      )
    )
  }
}
