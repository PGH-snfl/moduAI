import { useEffect } from 'react'

function findHorizontalScroller(target: EventTarget | null): HTMLElement | null {
  let element = target instanceof HTMLElement ? target : null

  while (element && element !== document.body) {
    const { overflowX } = window.getComputedStyle(element)
    const allowsHorizontalScroll = overflowX === 'auto' || overflowX === 'scroll'

    if (allowsHorizontalScroll && element.scrollWidth > element.clientWidth + 1) {
      return element
    }

    element = element.parentElement
  }

  return null
}
export function useHorizontalWheelScroll() {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.deltaY === 0) return

      const scroller = findHorizontalScroller(event.target)
      if (!scroller) return

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
      const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, scroller.scrollLeft + event.deltaY))

      // At either edge, leave the wheel event alone so page scrolling continues.
      if (nextScrollLeft === scroller.scrollLeft) return

      event.preventDefault()
      scroller.scrollLeft = nextScrollLeft
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [])
}
