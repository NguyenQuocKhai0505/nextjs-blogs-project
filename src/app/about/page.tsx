import Image from "next/image"
import Link from "next/link"

const profile = {
  name: "Nguyen Quoc Khai",
  role: "Web Developer",
  bio: `I am a technology enthusiast with a strong passion for IT and continuous learning. I enjoy exploring new tools, building projects, and solving problems through code. 
          With a curious mindset and a drive to grow, I’m always looking for opportunities to improve my skills and create useful, modern digital solutions.`,
  avatar: "/NguyenQuocKhai.jpg",
  links: [
    { label: "Email", href: "mailto:khainguyen05.contact@gmail.com", icon: "/Gmail.png" },
    { label: "Facebook", href: "https://www.facebook.com/nguyen.quoc.khai.479002/", icon: "/Facebook.png" },
    { label: "Instagram", href: "https://www.instagram.com/qu.khai05?fbclid=IwY2xjawOWNzRleHRuA2FlbQIxMABicmlkETFPUDFmMlladVcxUXNodFAxc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHv_ecafleEjtgJWxHFBFP6Wy7QMt86m5rWxMuRRnhPb2-znz_1LyeB6cZ9ft_aem_LFGAGv06JJDCnOOKUfGr7g", icon: "/Instagram.png" },
  ],
}

export default function AboutPage() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 rounded-3xl border bg-card/70 p-10 shadow-2xl md:flex-row md:items-center">
        <div className="h-44 w-44 flex-shrink-0 overflow-hidden rounded-full border-4 border-primary/40 shadow-2xl">
          <Image src={profile.avatar} alt={profile.name} width={176} height={176} className="h-full w-full object-cover" priority />
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="text-4xl font-bold">{profile.name}</h1>
            <p className="text-lg text-muted-foreground">{profile.role}</p>
          </div>
          <p className="text-lg leading-relaxed">{profile.bio}</p>

          <div className="flex flex-wrap gap-4">
          <p className="text-sm font-semibold text-muted-foreground">Contact me on:</p>
            {profile.links.map(link => (
              <Link
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition hover:border-primary hover:bg-primary/10"
              >
                
                <Image src={link.icon} alt={`${link.label} icon`} width={20} height={20} className="h-5 w-5 object-contain" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}