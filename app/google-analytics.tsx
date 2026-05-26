import { GoogleAnalyticsPageView } from "./google-analytics-page-view";

type GoogleAnalyticsProps = {
  measurementId: string;
};

export function GoogleAnalyticsScripts({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `,
        }}
      />
    </>
  );
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return <GoogleAnalyticsPageView measurementId={measurementId} />;
}
