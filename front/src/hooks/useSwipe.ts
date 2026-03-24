import { useState } from 'react'

export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [startX, setStartX] = useState(0)
  const [offset, setOffset] = useState(0)

  return {
    onTouchStart: (e: React.TouchEvent) => {
      setStartX(e.touches[0].clientX)
      setOffset(0)
    },
    onTouchMove: (e: React.TouchEvent) => {
      const diff = e.touches[0].clientX - startX
      if (diff > -100 && diff < 100) {
        setOffset(diff)
      }
    },
    onTouchEnd: () => {
      if (offset < -50 && onSwipeLeft) onSwipeLeft()
      else if (offset > 50 && onSwipeRight) onSwipeRight()
      setOffset(0)
    },
    offset,
  }
}
