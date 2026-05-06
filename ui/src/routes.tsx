import {createBrowserRouter, useRouteError} from 'react-router-dom';
import {JSX} from 'react';
import {
  approveDocumentUrl,
  baseUrl,
  createManuscriptUrl,
  createTransliterationUrl,
  documentMergerUrl,
  firstXmlReviewUrl,
  forgotPasswordUrl,
  homeUrl,
  loginUrl,
  managePicturesUrl,
  oxtedUrl,
  pipelineManagementUrl,
  preferencesUrl,
  registerUrl,
  resetPasswordUrl,
  secondXmlReviewUrl,
  transliterationReviewUrl,
  userManagementUrl,
  xmlComparatorUrl,
  xmlConversionUrl,
  dictionaryViewerUrl,
  createAnonymousTransliterationUrl,
  macroeditorUrl,
  suffixDictionaryUrl,
  stopListViewerUrl
} from './urls';
import {RegisterForm} from './forms/RegisterForm';
import {Home} from './Home';
import {App} from './App';
import {LoginForm} from './forms/LoginForm';
import {RequireAuth} from './RequireAuth';
import {CreateManuscriptForm} from './forms/CreateManuscriptForm';
import {StandAloneOXTED} from './xmlEditor/StandAloneOXTED';
import {DocumentMergerContainer} from './documentMerger/DocumentMergerContainer';
import {tlhXmlEditorConfig} from './xmlEditor/tlhXmlEditorConfig';
import {Preferences} from './Preferences';
import {XmlComparatorContainer} from './xmlComparator/XmlComparatorContainer';
import {DictionaryViewerContainer} from './xmlEditor/hur/dictionaryViewer/DictionaryViewerContainer';
import {MacroeditorContainer} from './xmlEditor/hur/macroeditor/MacroeditorContainer';
import {Rights, XmlReviewType} from './graphql';
import {ManuscriptData} from './manuscript/ManuscriptData';
import {UploadPicturesForm} from './manuscript/UploadPicturesForm';
import {TransliterationInputContainer} from './manuscript/TransliterationInput';
import {AnonymousTransliterationInput} from './manuscript/AnonymousTransliterationInput';
import {UserManagement} from './UserManagement';
import {TransliterationReview} from './manuscript/TransliterationReview';
import {XmlConversion} from './manuscript/xmlConversion/XmlConversion';
import {PipelineOverview} from './pipeline/PipelineOverview';
import {XmlReview} from './manuscript/review/XmlReview';
import {DocumentApproval} from './manuscript/DocumentApproval';
import {ForgotPasswordForm} from './forms/ForgotPasswordForm';
import {ResetPasswordForm} from './forms/ResetPasswordForm';
import {getGlobalDictionary} from './xmlEditor/hur/dict/dictionary';
import {getGlobalEnglishTranslations} from './xmlEditor/hur/translations/englishTranslations';
import {getGlobalReferences} from './xmlEditor/hur/references/references';
import {getGlobalNumericIDs} from './xmlEditor/hur/numericIDs/numericIDs';
import {getChanges} from './xmlEditor/hur/changes/changesAccumulator';
import {TextDisplay} from './xmlEditor/hur/concordanceEntryViewer/TextDisplay';
import {SuffixDictionaryContainer} from './xmlEditor/hur/dictionaryViewer/SuffixDictionaryContainer';
import {StopListViewer} from './xmlEditor/hur/StopListViewer';
import {getGlobalStopList} from './xmlEditor/hur/stopList/stopList';

export const router = createBrowserRouter([
    {
      path: '/',
      element: <App/>,
      children: [
        {path: homeUrl, element: <Home/>},

        {path: registerUrl, element: <RegisterForm/>},
        {path: loginUrl, element: <LoginForm/>},
        {path: forgotPasswordUrl, element: <ForgotPasswordForm/>},
        {path: resetPasswordUrl, element: <ResetPasswordForm/>},
        {path: userManagementUrl, element: <RequireAuth minRights={Rights.ExecutiveEditor}>{() => <UserManagement/>}</RequireAuth>},

        {path: createManuscriptUrl, element: <RequireAuth>{() => <CreateManuscriptForm/>}</RequireAuth>},

        {path: pipelineManagementUrl, element: <RequireAuth minRights={Rights.ExecutiveEditor}>{() => <PipelineOverview/>}</RequireAuth>},

        {
          path: 'manuscripts/:mainIdentifier', children: [
            {path: 'data', element: <ManuscriptData/>},
            {path: managePicturesUrl, element: <RequireAuth>{(currentUser) => <UploadPicturesForm currentUser={currentUser}/>}</RequireAuth>},
            {
              path: createTransliterationUrl,
              element: <RequireAuth>{(currentUser) => <TransliterationInputContainer currentUser={currentUser}/>}</RequireAuth>
            },
            {path: transliterationReviewUrl, element: <RequireAuth minRights={Rights.Reviewer}>{() => <TransliterationReview/>}</RequireAuth>},
            {path: xmlConversionUrl, element: <RequireAuth minRights={Rights.Reviewer}>{() => <XmlConversion/>}</RequireAuth>},
            {
              path: firstXmlReviewUrl,
              element: <RequireAuth minRights={Rights.Reviewer}>{() => <XmlReview reviewType={XmlReviewType.FirstXmlReview}/>}</RequireAuth>
            },
            {
              path: secondXmlReviewUrl,
              element: <RequireAuth minRights={Rights.Reviewer}>{() => <XmlReview reviewType={XmlReviewType.SecondXmlReview}/>}</RequireAuth>
            },
            {path: approveDocumentUrl, element: <RequireAuth minRights={Rights.ExecutiveEditor}>{() => <DocumentApproval/>}</RequireAuth>}
          ]
        },

        {path: oxtedUrl, element: <StandAloneOXTED editorConfig={tlhXmlEditorConfig}/>},

        {path: xmlComparatorUrl, element: <XmlComparatorContainer/>},
        
        {path: dictionaryViewerUrl,
         element: <DictionaryViewerContainer
                    getInitialDictionary={getGlobalDictionary}
                    getInitialEnglishTranslations={getGlobalEnglishTranslations}
                    getInitialReferences={getGlobalReferences}
                    getInitialNumericIDs={getGlobalNumericIDs}/>},
        
        {path: macroeditorUrl, element: <MacroeditorContainer getChanges={getChanges}/>},

        {path: suffixDictionaryUrl, element: <SuffixDictionaryContainer
                                              getInitialDictionary={getGlobalDictionary}/>},

        {path: stopListViewerUrl, element: <StopListViewer
                                            getInitialStopList={getGlobalStopList}/>},

        {path: preferencesUrl, element: <Preferences/>},

        {path: documentMergerUrl, element: <DocumentMergerContainer/>},

        {path: createAnonymousTransliterationUrl, element: <AnonymousTransliterationInput/>},

        {path: 'texts/:text', element: <TextDisplay/>},

        {path: 'texts/:text/:highlightedAnalysis', element: <TextDisplay/>},

      ],
      errorElement: <ErrorBoundary/>
    }
  ],
  {
    basename: baseUrl
  }
);

function ErrorBoundary(): JSX.Element {

  const error = useRouteError();
  console.error(error);

  return (
    <div>Error...</div>
  );
}
