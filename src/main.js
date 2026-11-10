import './styles.css'

document.documentElement.classList.add('is-ready')

const year = new Date().getFullYear()
const meta = document.querySelector('.meta')
if (meta) {
  meta.textContent = `山东大学翻译学院 · ${year}`
}
