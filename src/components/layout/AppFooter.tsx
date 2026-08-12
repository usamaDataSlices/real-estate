import { Link } from 'react-router-dom'
import { footerNavItems } from '../../config/navigation'

export default function AppFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-10 mt-16 text-neutral-600 text-sm">
      <div className="container grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold font-heading tracking-wide text-neutral-900">
              BELGRAVIA <span className="font-extralight text-accent-dark">ESTATES</span>
            </span>
          </div>
          <p className="font-light leading-relaxed max-w-sm text-neutral-600">
            Providing premium real estate services, luxury home curation, and investment advisory in prime development tracts.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-neutral-900 uppercase tracking-wider text-xs">Resources</h4>
          <ul className="space-y-2">
            {footerNavItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-neutral-900 uppercase tracking-wider text-xs">Legal</h4>
          <p className="font-light leading-relaxed">
            Licensed Real Estate Brokerage.<br />
            Licensed by DED, Regulated by RERA number 12847.<br />
            © {new Date().getFullYear()} Belgravia Estates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
