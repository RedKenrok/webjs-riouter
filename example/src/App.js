// Get library.
import { component } from 'riot'

// Get component.
import appComponent from './app.html'

class App {
  constructor(parent) {
    // Store parent element.
    this._parent = parent

    // Create root element for app.
    this._element = document.createElement('div')
    this._parent.append(this._element)

    this._component = component(appComponent)(
      this._element, { app: this }
    )
  }
}

export default App
