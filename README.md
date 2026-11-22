# SSG Exercise (Astro)
 
Two pages from my portfolio (Home and Projects) built with Astro. Both use one shared footer component.
 
## Structure
 
- `src/components/Footer.astro`: the shared footer, edited in one place
- `src/pages/index.astro`: Home page
- `src/pages/projects/index.astro`: Projects page
- `public/`: copied CSS, scripts and images from the portfolio
## Commands
 
Requires Node 22.23.4 or newer. Run these from this folder (`ssg-exercise/`).
 
```sh
npm install        # install dependencies
npm run build      # generate the site into dist/
npm run preview    # serve the built site locally
```
 
Open the address printed by `npm run preview` (usually http://localhost:4321) and check:
 
- `/` shows the Home page and the shared footer
- `/projects/` shows the Projects page and the same footer
To see the shared section update, edit `src/components/Footer.astro`, run `npm run build` again, and refresh both pages.
 
