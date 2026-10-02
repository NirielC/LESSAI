package expo.modules.lessaivision

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LessaiVisionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LessaiVision")

    /** ¿Hay modelo de abecedario instalado? (para que la UI sepa si mostrar letras). */
    Function("hasLettersModel") {
      val ctx = appContext.reactContext ?: return@Function false
      val names = ctx.assets.list("")?.toSet() ?: emptySet()
      "lessa_letters.tflite" in names || "lessa_letters_motion.tflite" in names
    }

    View(LessaiVisionView::class) {
      Events("onPrediction", "onStatus", "onEngineError")

      Prop("active") { view: LessaiVisionView, value: Boolean -> view.setActive(value) }
      Prop("facing") { view: LessaiVisionView, value: String -> view.setFacing(value) }
      Prop("showHands") { view: LessaiVisionView, value: Boolean -> view.showHands = value }
      Prop("letters") { view: LessaiVisionView, value: Boolean -> view.lettersEnabled = value }
    }
  }
}
