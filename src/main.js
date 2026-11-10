import './styles.css'

const year = new Date().getFullYear()
document.title = document.title.replace(/\b\d{4}\b/, year)

const sections = document.querySelectorAll('.section')

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )
  sections.forEach((section) => observer.observe(section))
} else {
  sections.forEach((section) => section.classList.add('is-visible'))
}
