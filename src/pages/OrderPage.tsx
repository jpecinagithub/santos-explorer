import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Seo from "../components/Seo";
import SaintCard from "../components/SaintCard";
import { useReader } from "../components/ReaderContext";
import { allOrders, saintsByOrder, orderName } from "../lib/saints";
import { trackEvent } from "../lib/analytics";

export function OrdersPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "es" ? "es" : "en";
  const orders = allOrders();
  return (
    <>
      <Seo title={t("orders.title")} path="/orders" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t("orders.title")}</h1>
        <p className="text-muted mb-8">{t("orders.subtitle")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/order/${o.id}`}
              className="group bg-white border border-line rounded-2xl p-6 hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all"
            >
              <h2 className="text-xl font-bold group-hover:text-accent-deep transition-colors">
                {lang === "es" ? o.es : o.en}
              </h2>
              <p className="text-sm font-semibold text-accent-deep mt-2">
                {o.n === 1 ? t("orders.member", { n: o.n }) : t("orders.members", { n: o.n })}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function OrderPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "es" ? "es" : "en";
  const { orderId } = useParams<{ orderId: string }>();
  const { openSaint } = useReader();

  const order = allOrders().find((o) => o.id === orderId);

  useEffect(() => {
    if (order) trackEvent("order_selected", { order: order.id });
  }, [order]);
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">{t("common.notFound")}</h1>
        <Link to="/orders" className="px-6 py-2.5 rounded-full bg-night text-white text-sm font-medium">
          {t("orders.title")}
        </Link>
      </div>
    );
  }

  const list = saintsByOrder(order.id);
  const name = orderName(order.id, lang) ?? order.en;

  return (
    <>
      <Seo title={name} path={`/order/${order.id}`} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep mb-2">{t("orders.title")}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{name}</h1>
        <p className="text-muted mb-8">{list.length.toLocaleString()} {t("common.saints")}</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 60).map((s) => (
            <SaintCard key={s.id} saint={s} onOpen={openSaint} />
          ))}
        </div>
        {list.length > 60 && (
          <div className="text-center mt-10">
            <Link
              to={`/explore?order=${order.id}`}
              className="px-8 py-3 rounded-full bg-night text-white text-sm font-medium hover:bg-ink-soft transition-colors"
            >
              {t("common.viewAll")} ({list.length.toLocaleString()})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
