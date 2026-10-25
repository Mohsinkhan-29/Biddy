export const SELECTORS = {
  feed: {
    jobCard:
      '[data-test="job-tile"], ' +
      'section[data-ev-label="visible_job_tile_impression"], ' +
      'article[data-test="JobTile"], ' +
      '[data-ev-label="search_results_impression"]',

    filterToggle:
      '[data-test="filters-sidebar-toggle"], ' +
      '[data-test="filter-button"], ' +
      'button.air3-search-box-advance-toggle',

    jobLink:
      'h3.job-tile-title a[href*="~"]',
  },

  jobCard: {
    title:
      '[data-test="job-title"], h3.job-tile-title a, h2.job-tile-title a, ' +
      '[data-test="job-tile-title-link"]',

    description:
      '[data-test="job-description-text"], ' +
      '[data-test="UpCLineClamp JobDescription"], ' +
      '[data-test="JobDescription"]',

    // Example:
    // Hourly: $15-$30
    // Fixed-price: $500
    budget:
      '[data-test="job-type"], [data-test="job-type-label"], ' +
      '[data-test="BudgetAmount"]',

    contractorTier:
      '[data-test="contractor-tier"]',

    duration:
      '[data-test="duration"]',

    proposalsTier:
      '[data-test="proposals-tier"], [data-test="proposals"]',

    // Not present in supplied markup
    connects:
      '[data-test="connects-required"], [data-test="connects"]',

    postedAt:
      '[data-test="posted-on"], [data-test="PostedOn"]',

    paymentVerified:
      '[data-test="payment-verification-status"], [data-test="payment-verified"]',

    identityVerified:
      '[data-test="identity-verification-status"], ' +
      '[data-test="identity-verified"], ' +
      '[data-test="identity-status"]',

    clientSpend:
      '[data-test="client-spendings"] [data-test="formatted-amount"], ' +
      '[data-qa="client-spend"], [data-test="total-spent"]',

    clientHireRate:
      '[data-test="client-hire-rate"], [data-qa="client-job-posting-stats"]',

    clientLocation:
      '[data-test="client-country"], [data-qa="client-location"] strong, ' +
      '[data-test="location"]',

    clientFeedback:
      '[data-test="client-feedback"]',

    clientRating:
      '[data-ev-sublocation="!rating"]',

    skills:
      '[data-test="attr-item"]',

    saveButton:
      '[data-test="job-save-button"]',
  },

  jobDetailPage: {
    // Priority order (scraper tries each in turn): the slide-over panel on
    // /find-work/ feeds first, then the full /jobs/~ page.
    root:
      '[data-test="job-details-viewer"], .air3-slider-content, ' +
      '.job-details-content, [data-test="job-details"], main#main-content',

    title:
      'h1[data-test="job-title"], h1.up-n-link',

    description:
      '[data-test="Description"], ' +
      '[data-test="job-description"], ' +
      '[data-test="description"], ' +
      '.air3-line-clamp',

    clientFeedback:
      '[data-test="client-feedback-item"], ' +
      '[data-test="feedback"]',
  },
} as const;