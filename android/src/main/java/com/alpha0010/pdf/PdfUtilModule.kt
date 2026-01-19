package com.alpha0010.pdf

import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import java.io.File
import java.io.FileNotFoundException
import java.util.concurrent.locks.Lock
import kotlin.concurrent.withLock

class PdfUtilModule(reactContext: ReactApplicationContext, private val pdfMutex: Lock) :
  NativePdfUtilSpec(reactContext) {
  /**
   * Get the number of pages of a pdf.
   */
  override fun getPageCount(source: String, promise: Promise) {
    val file = File(source)
    val fd: ParcelFileDescriptor
    try {
      fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: FileNotFoundException) {
      promise.reject("ENOENT", e)
      return
    }

    val pageCount = pdfMutex.withLock {
      val renderer = try {
        PdfRenderer(fd)
      } catch (e: Exception) {
        fd.close()
        promise.reject(e)
        return
      }
      val res = renderer.pageCount
      renderer.close()
      return@withLock res
    }
    fd.close()

    promise.resolve(pageCount)
  }

  /**
   * Get the dimensions of every page.
   */
  override fun getPageSizes(source: String, promise: Promise) {
    val file = File(source)
    val fd = try {
      ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    } catch (e: FileNotFoundException) {
      promise.reject("ENOENT", e)
      return
    }

    val pageSizes = pdfMutex.withLock {
      val renderer = try {
        PdfRenderer(fd)
      } catch (e: Exception) {
        fd.close()
        promise.reject(e)
        return
      }
      // Read dimensions (in pdf units) of all pages.
      val pages = Arguments.createArray()
      for (pageNum in 0 until renderer.pageCount) {
        val pdfPage = try {
          renderer.openPage(pageNum)
        } catch (e: Exception) {
          renderer.close()
          fd.close()
          promise.reject(e)
          return
        }

        val pageDim = Arguments.createMap()
        pageDim.putInt("height", pdfPage.height)
        pageDim.putInt("width", pdfPage.width)
        pages.pushMap(pageDim)

        pdfPage.close()
      }
      renderer.close()
      return@withLock pages
    }
    fd.close()

    promise.resolve(pageSizes)
  }
}
