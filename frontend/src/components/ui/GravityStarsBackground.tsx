const stars = Array.from({ length: 72 }, (_, index) => ({
  left: `${(index * 47) % 101}%`,
  top: `${(index * 71) % 99}%`,
  delay: `${(index % 9) * -0.45}s`,
  size: `${index % 4 === 0 ? 2 : 1}px`,
}))

export function GravityStarsBackground() {
  return <div className="gravity-stars-background" aria-hidden="true">{stars.map((star, index) => <span key={index} style={{ left: star.left, top: star.top, animationDelay: star.delay, width: star.size, height: star.size }} />)}</div>
}
