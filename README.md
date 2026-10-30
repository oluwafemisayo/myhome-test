# MyHome — tester web app

A standalone, phone-ready version of the MyHome prototype for recruited testers.
It opens from a single link, needs no sign-in, and adds a light test layer:

- **Welcome and consent** before the app, asking testers to use made-up details.
- **Tasks bar** at the top: testers pick a task, then tap *I did it* or *I got stuck*, with an optional note. Time on task and screens visited are recorded.
- **Feedback** button on every screen.
- **Finish and send**: testers see exactly what will be shared, then email it, send it to a form, copy it, or download a file.

Nothing leaves the tester's phone until they choose to send it. Results are stored in the browser (localStorage) until then.

## Before you share it

Edit `config.js`:

- `contactEmail`: your research inbox, so testers can email results.
- `postUrl` (optional): a form endpoint that accepts JSON, for example a Formspree form, so results arrive without email.
- `tasks`: change the wording or the list to suit each round.

## Put it online (free)

Any static host works. The files only need to be served as they are.

**Netlify Drop (quickest, no code)**
1. Go to app.netlify.com/drop and sign in.
2. Drag the whole `tester-web` folder onto the page.
3. You get a link like `https://something.netlify.app`. Rename it in Site settings if you like.

**GitHub Pages**
1. Create a repository and upload the contents of `tester-web`.
2. Settings → Pages → deploy from the main branch, root folder.

**Vercel**: import the folder as a project with no build step.

The page sets `noindex`, so search engines won't list it. Anyone with the link can open it, so share it only with testers.

## Links you can send

- `…/index.html`: starts at onboarding (normal test).
- `…/index.html?start=Renting%2C%20set%20up`: skips onboarding, already renting.
- Other starts: `Buying (no renting)`, `Buying (offer accepted)`, `Owning (after renting)`, `Owning (never rented)`.

## Tasks and end questions

Each task in `config.js` names the example the app should open in (`start`), for example `Buying (no renting)` for the offer and broker tasks or `Owning (after renting)` for remortgaging. The app only switches when a task needs a different example, and the tester sees a short note when it does. Tasks 9–11 lead to the revenue screens: the Buying pass, broker comparison with fees disclosed, and remortgage help.

`questions` are asked at the end. A question with `after` only appears if the tester tried one of those tasks, so nobody is asked about a screen they never saw. Answers appear in the results under "Prices and trust".

## Comparing two designs

The app is built in two designs from the same source: the current one (`app.js`) and Hearth (`app-hearth.js`). `designs` in `config.js` controls who sees what:

- `'both'` (default): every tester does all tasks in one design, then repeats the `compareTasks` (rent increase, scanning a bill, a dated to-do) in the other and says which they prefer. Half start with each design, at random.
- `'random'`: each tester sees one design.
- `'current'` or `'hearth'`: everyone sees that one.

Links can override it: `?design=hearth` or `?design=current` (one design only), `?order=hearth-first` or `?order=current-first`. Results record the design order, which design each task was done in, and the preference answers.

Testers can add it to their home screen (Share → Add to Home Screen on iPhone; ⋮ → Add to home screen on Android) so it opens like an app.

## Updating after prototype changes

The app is generated from `../prototype-source/project/Main.dc.html`:

```bash
python3 tester-web/build.py
```

This also rebuilds the Hearth version with `../prototype-source/tools/make_hearth.py`. Then upload the changed files again (usually `app.js` and `app-hearth.js`).

## Good to know

- The app itself restarts if the page is reloaded; task results and feedback are kept.
- It loads Preact and Google Fonts from public CDNs, so testers need an internet connection.
- All data in the app is fictional. Don't ask testers to upload real documents.
