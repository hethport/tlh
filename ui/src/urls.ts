const baseServerUrl = import.meta.env.PROD
  ? `/tlh_editor/${import.meta.env.VITE_VERSION}`
  : 'http://localhost:8066';

export const baseUrl = import.meta.env.PROD
  ? `${baseServerUrl}/public`
  : '';

export const apolloUri = `${baseServerUrl}/graphql.php`;

export const pictureUploadUrl = (mainIdentifier: string): string => `${baseServerUrl}/uploadPicture.php?id=${encodeURIComponent(mainIdentifier)}`;

export const pictureBaseUrl = (mainIdentifier: string): string => `${baseServerUrl}/uploads/${encodeURIComponent(mainIdentifier)}`;

export const homeUrl = '/';

export const createManuscriptUrl = '/createManuscript';

export const registerUrl = '/registerForm';
export const loginUrl = '/login';
export const forgotPasswordUrl = '/forgotPassword';
export const resetPasswordUrl = '/resetPassword';

export const preferencesUrl = '/preferences';

export const oxtedUrl = '/OXTED';

export const xmlComparatorUrl = '/xmlComparator';

export const documentMergerUrl = '/documentMerger';

export const dictionaryViewerUrl = '/dictionaryViewer';

export const macroeditorUrl = '/macroeditor';

export const suffixDictionaryUrl = '/suffixDictionary';

export const stopListViewerUrl = '/stopList';

export const userManagementUrl = '/userManagement';

export const pipelineManagementUrl = '/pipelineManagement';

// Fragments

export const manuscriptsUrlFragment = 'manuscripts';

export const managePicturesUrl = 'managePictures';

export const createTransliterationUrl = 'createTransliteration';

export const createAnonymousTransliterationUrl = 'createAnonymousTransliteration';

export const transliterationReviewUrl = 'transliterationReview';

export const xmlConversionUrl = 'xmlConversion';

export const firstXmlReviewUrl = 'firstXmlReview';

export const secondXmlReviewUrl = 'secondXmlReview';

export const approveDocumentUrl = 'approveDocument';

// Foreign urls

const tlhAnalyzerBaseUrl = import.meta.env.DEV
  ? 'https://www.hethport3.uni-wuerzburg.de/'
  : '';

export const tlhWordAnalyzerUrl = `${tlhAnalyzerBaseUrl}/TLHaly/jasonanalysis.php`;

export const tlhDocumentAnalyzerUrl = `${tlhAnalyzerBaseUrl}/TLHaly/deuteDokument.php`;

export const getCuneiformUrl = `${tlhAnalyzerBaseUrl}/TLHcuni/create_cuneiform_single.php`;