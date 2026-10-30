/* Edit this file before you share the link. */
window.STUDY = {
  name: 'MyHome prototype test',
  // Where testers send results. Leave blank to hide that option.
  contactEmail: 'preferred.femisayo@gmail.com',          // e.g. 'research@yourdomain.co.uk' — results open in the tester's email app
  postUrl: '',               // optional: a form endpoint (e.g. Formspree) that accepts JSON POSTs
  minutes: 25,
  // Design comparison: 'both' (each tester tries both, order alternates), 'random' (one each),
  // or 'current' / 'hearth' (everyone sees that one). A link can force one: ?design=hearth
  designs: 'both',
  // Tasks repeated in the second design when designs is 'both'
  compareTasks: ['t2', 't3', 't7'],
  // Each task opens the app in the example it needs ("start"). The app only switches when the
  // example changes, and the tester is told when it does.
  tasks: [
    { id: 't1', start: 'Onboarding', title: 'Get set up as a renter', hint: 'Start the app as someone who rents, and add the home you rent now.' },
    { id: 't2', start: 'Renting, set up', title: 'Understand a rent increase', hint: 'You’ve had a letter about your rent going up. Find out what it means and what you could do.' },
    { id: 't3', start: 'Renting, set up', title: 'Add a bill by scanning it', hint: 'Add your broadband bill without typing it in.' },
    { id: 't4', start: 'Renting, set up', title: 'Check a rental before you apply', hint: 'You’re thinking about moving. Find out whether 23 Garden Terrace breaks any rental rules.' },
    { id: 't5', start: 'Renting, set up', title: 'Get ready to buy', hint: 'Build your mortgage-ready pack and send it to a broker.' },
    { id: 't6', start: 'Buying (offer accepted)', title: 'Find a solicitor', hint: 'Your offer has been accepted. Find a solicitor and ask one for a quote.' },
    { id: 't7', start: 'Renting, set up', title: 'Plan a to-do with a date', hint: 'Add “Book the van” to a list, due next week.' },
    { id: 't8', start: 'Renting, set up', title: 'Talk to Ara', hint: 'Without typing, ask Ara to remind you to pay the window cleaner on Friday. Then ask when your rent is due.' },
    { id: 't9', start: 'Buying (no renting)', title: 'Your offer was accepted', hint: 'The seller accepted your offer on 12 Larch Close. Tell MyHome, then choose how much help you want with the purchase.' },
    { id: 't10', start: 'Buying (no renting)', title: 'Find a mortgage broker', hint: 'You don’t have a mortgage broker yet. Find one you’d be happy with and send them your mortgage-ready pack.' },
    { id: 't11', start: 'Owning (after renting)', title: 'Plan your remortgage', hint: 'You own your home and your fixed-rate mortgage ends in a while. Find out what to do, and get help comparing deals.' }
  ],
  // Short questions at the end. "after" shows a question only to testers who tried one of those tasks.
  questions: [
    { id: 'pass', after: ['t9'], ask: 'Would you pay £79 for the Buying pass when you buy a home?', options: ['Yes', 'Maybe', 'No'] },
    { id: 'passPrice', after: ['t9'], ask: 'What would feel like a fair price for it?', options: ['Under £30', '£30–£60', '£60–£100', 'Over £100', 'I wouldn’t pay'] },
    { id: 'trust', after: ['t10', 't11'], ask: 'You saw which brokers pay MyHome. Did that change how much you trust the list?', options: ['I trust it more', 'No change', 'I trust it less', 'I didn’t notice'] },
    { id: 'monthly', ask: 'Would you pay a monthly fee for MyHome to read your letters and remind you of dates?', options: ['Yes, up to £3 a month', 'Yes, up to £6 a month', 'Maybe', 'No'] }
  ]
};
