type AdminPageFrameVariant = "default" | "management-list";

type AdminPageFrameProps = {
  variant?: AdminPageFrameVariant;
  badges?: string[];
  eyebrow: string;
  title: string;
  summary: string;
  overview?: React.ReactNode;
  operationsTitle: string;
  operationsDescription: string;
  operations: React.ReactNode;
  contentTitle: string;
  contentDescription: string;
  contentBadge?: string;
  contentSectionClassName?: string;
  contentBodyClassName?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function FrameHeader({
  badges,
  eyebrow,
  title,
  summary,
  overview,
}: Pick<
  AdminPageFrameProps,
  "badges" | "eyebrow" | "title" | "summary" | "overview"
>) {
  const hasHeader = Boolean(
    (badges && badges.length > 0) || eyebrow || title || summary || overview,
  );

  if (!hasHeader) {
    return null;
  }

  return (
    <header className="admin-page-heading">
      <div className="admin-badge-row">
        {badges?.map((badge) => (
          <span key={badge} className="admin-badge">
            {badge}
          </span>
        ))}
      </div>

      <p className="admin-eyebrow">{eyebrow}</p>
      <h1 className="admin-page-heading-title">{title}</h1>
      <p className="admin-page-heading-summary">{summary}</p>

      {overview ? <div className="admin-overview">{overview}</div> : null}
    </header>
  );
}

function FrameOperationsCard({
  operationsTitle,
  operationsDescription,
  operations,
}: Pick<
  AdminPageFrameProps,
  "operationsTitle" | "operationsDescription" | "operations"
>) {
  const hasOperationsHeader = Boolean(operationsTitle || operationsDescription);

  return (
    <section className="admin-panel">
      {hasOperationsHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="admin-panel-kicker">Operations</p>
            <h2 className="admin-panel-title">{operationsTitle}</h2>
            <p className="admin-panel-description">{operationsDescription}</p>
          </div>
        </div>
      ) : null}

      <div className={hasOperationsHeader ? "mt-5" : undefined}>
        {operations}
      </div>
    </section>
  );
}

function FrameContentCard({
  contentTitle,
  contentDescription,
  contentBadge,
  contentSectionClassName,
  contentBodyClassName,
  children,
}: Pick<
  AdminPageFrameProps,
  | "contentTitle"
  | "contentDescription"
  | "contentBadge"
  | "contentSectionClassName"
  | "contentBodyClassName"
  | "children"
>) {
  const hasContentHeader = Boolean(
    contentTitle || contentDescription || contentBadge,
  );

  return (
    <section className={cx("admin-panel", contentSectionClassName)}>
      {hasContentHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-panel-kicker">Business Content</p>
            <h2 className="admin-panel-title">{contentTitle}</h2>
            <p className="admin-panel-description">{contentDescription}</p>
          </div>

          {contentBadge ? (
            <span className="admin-badge admin-badge-muted">
              {contentBadge}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cx(
          hasContentHeader ? "mt-5" : undefined,
          contentBodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function AdminPageFrame({
  variant = "default",
  badges,
  eyebrow,
  title,
  summary,
  overview,
  operationsTitle,
  operationsDescription,
  operations,
  contentTitle,
  contentDescription,
  contentBadge,
  contentSectionClassName,
  contentBodyClassName,
  children,
  aside,
}: AdminPageFrameProps) {
  if (variant === "management-list") {
    return (
      <div className="admin-page-stack">
        <FrameHeader
          badges={badges}
          eyebrow={eyebrow}
          title={title}
          summary={summary}
          overview={overview}
        />
        <FrameOperationsCard
          operationsTitle={operationsTitle}
          operationsDescription={operationsDescription}
          operations={operations}
        />
        <FrameContentCard
          contentTitle={contentTitle}
          contentDescription={contentDescription}
          contentBadge={contentBadge}
          contentSectionClassName={cx("flex flex-col", contentSectionClassName)}
          contentBodyClassName={cx("flex flex-col", contentBodyClassName)}
        >
          {children}
        </FrameContentCard>
      </div>
    );
  }

  return (
    <div className="admin-page-grid">
      <div className="admin-page-column">
        <FrameHeader
          badges={badges}
          eyebrow={eyebrow}
          title={title}
          summary={summary}
          overview={overview}
        />
        <FrameOperationsCard
          operationsTitle={operationsTitle}
          operationsDescription={operationsDescription}
          operations={operations}
        />
        <FrameContentCard
          contentTitle={contentTitle}
          contentDescription={contentDescription}
          contentBadge={contentBadge}
          contentSectionClassName={contentSectionClassName}
          contentBodyClassName={contentBodyClassName}
        >
          {children}
        </FrameContentCard>
      </div>

      {aside ? <div className="admin-page-column">{aside}</div> : null}
    </div>
  );
}
