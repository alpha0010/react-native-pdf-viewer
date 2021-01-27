package com.alpha0010.pdf

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import java.util.concurrent.locks.ReentrantLock

class PdfViewPackage : ReactPackage {
  private val pdfMutex = ReentrantLock()

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf<NativeModule>(PdfUtilModule(reactContext, pdfMutex))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf<ViewManager<*, *>>(PdfViewManager(pdfMutex))
  }
}
