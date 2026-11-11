import landscapeUrl from '../../assets/beautiful-landscape.webp'

export function WelcomeBackground(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={landscapeUrl}
        alt=""
        className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] object-cover object-[50%_58%] blur-[2px] brightness-[0.82] saturate-[0.82]"
      />
      <div className="absolute inset-0 bg-white/[0.22]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(23,43,77,0.19)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.20),transparent_30%,transparent_70%,rgba(255,255,255,0.18))]" />
    </div>
  )
}
