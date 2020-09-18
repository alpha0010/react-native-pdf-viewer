package com.alpha0010

import android.graphics.pdf.PdfRenderer
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.*

class PdfUtilModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "RNPdfUtil"
  }

  @ReactMethod
  fun unpackAsset(source: String, promise: Promise) {
    val file = File(reactApplicationContext.cacheDir, source)
    if (!file.exists()) {
      val asset: InputStream
      try {
        asset = reactApplicationContext.assets.open(source)
      } catch (e: IOException) {
        promise.reject(e)
        return
      }

      val output = FileOutputStream(file)
      val buffer = ByteArray(1024)
      var size = asset.read(buffer)
      while (size != -1) {
        output.write(buffer, 0, size)
        size = asset.read(buffer)
      }
      output.close()
      asset.close()
    }

    promise.resolve(file.absolutePath)
  }

  // Example method
  // See https://facebook.github.io/react-native/docs/native-modules-android
  @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
  @ReactMethod
  fun getPageCount(source: String, promise: Promise) {
    val file = File(source)
    val fd: ParcelFileDescriptor
    try {
      fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: FileNotFoundException) {
      promise.reject("ENOENT", e)
      return
    }

    val renderer = PdfRenderer(fd)
    val pageCount = renderer.pageCount
    renderer.close()
    fd.close()

    promise.resolve(pageCount)
  }
}
