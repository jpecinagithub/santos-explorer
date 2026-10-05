import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface Props {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
}

const SITE = "https://vidas-de-santos.app";

export default function Seo({ title, description, path = "/", image }: Props) {
  const { t, i18n } = useTranslation();
  const fullTitle = title ? `${title} · Vidas de Santos` : t("meta.title");
  const desc = description ?? t("meta.description");
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <html lang={i18n.language === "es" ? "es" : "en"} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Vidas de Santos" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
