"use client";

import { useEffect, useState } from "react";
import { FileImage, LoaderCircle, Minus, Plus, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Lens } from "@/components/ui/lens";
import { apiFetchBlob } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { DocumentPageRead } from "@/lib/types/api";
import { formatNumber } from "@/lib/utils/format";
import { cleanOcrTextForDisplay } from "@/lib/utils/ocr-display";

type PageTextViewerProps = {
  page: DocumentPageRead | null;
};

type PageImageState = {
  error: string | null;
  pageId: string | null;
  url: string | null;
};

const MIN_IMAGE_ZOOM = 0.5;
const MAX_IMAGE_ZOOM = 2.5;
const IMAGE_ZOOM_STEP = 0.25;
const BASE_IMAGE_HEIGHT_REM = 32;

export function PageTextViewer({ page }: PageTextViewerProps) {
  const { locale, messages } = useI18n();
  const [pageImage, setPageImage] = useState<PageImageState>({ error: null, pageId: null, url: null });
  const [imageZoom, setImageZoom] = useState(1);
  const hasPageImage = Boolean(page?.page_image_bucket && page.page_image_path);
  const currentPageImage = pageImage.pageId === page?.id ? pageImage : { error: null, pageId: null, url: null };
  const isPageImageLoading = Boolean(page && hasPageImage && !currentPageImage.url && !currentPageImage.error);
  const displayText = page ? cleanOcrTextForDisplay(page.extracted_text) : "";
  const canZoomOut = imageZoom > MIN_IMAGE_ZOOM;
  const canZoomIn = imageZoom < MAX_IMAGE_ZOOM;

  useEffect(() => {
    if (!page?.page_image_bucket || !page.page_image_path) {
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    void apiFetchBlob(`/api/v1/documents/${page.document_id}/pages/${page.id}/image`)
      .then((blob) => {
        if (revoked) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setPageImage({ error: null, pageId: page.id, url: objectUrl });
      })
      .catch((error) => {
        if (!revoked) {
          setPageImage({
            error: error instanceof Error ? error.message : messages.pageViewer.sourceUnavailable,
            pageId: page.id,
            url: null,
          });
        }
      });

    return () => {
      revoked = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [messages.pageViewer.sourceUnavailable, page]);

  return (
    <section className="flex min-h-[28rem] flex-col">
      <header className="mb-6 border-b border-border/70 pb-6">
        <h3 className="text-lg font-semibold tracking-tight">
          {page
            ? messages.pageViewer.titleWithPage.replace("{page}", String(page.page_number))
            : messages.pageViewer.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {page
            ? messages.pageViewer.descriptionWithPage
                .replace("{method}", messages.extractionMethod[page.extraction_method])
                .replace("{charCount}", formatNumber(page.char_count, locale))
            : messages.pageViewer.descriptionEmpty}
        </p>
      </header>

      {page ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">{messages.pageViewer.sourceTitle}</h4>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  aria-label="Zoom out"
                  disabled={!canZoomOut}
                  onClick={() => setImageZoom((current) => Math.max(MIN_IMAGE_ZOOM, current - IMAGE_ZOOM_STEP))}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
                  {Math.round(imageZoom * 100)}%
                </span>
                <Button
                  aria-label="Zoom in"
                  disabled={!canZoomIn}
                  onClick={() => setImageZoom((current) => Math.min(MAX_IMAGE_ZOOM, current + IMAGE_ZOOM_STEP))}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex h-[34rem] items-center justify-center overflow-auto rounded-md border border-border/80 bg-muted/20 p-3 shadow-sm">
              {isPageImageLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {messages.common.loading}
                </div>
              ) : currentPageImage.error ? (
                <p className="max-w-sm text-center text-sm text-destructive">{currentPageImage.error}</p>
              ) : currentPageImage.url ? (
                <Lens ariaLabel={messages.pageViewer.sourceTitle} className="max-h-full" lensSize={160} zoomFactor={2}>
                  {/* Blob URLs come from the authenticated API response and cannot be optimized by Next Image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={messages.pageViewer.sourceTitle}
                    className="w-auto rounded-sm shadow-sm"
                    src={currentPageImage.url}
                    style={{ height: `${BASE_IMAGE_HEIGHT_REM * imageZoom}rem` }}
                  />
                </Lens>
              ) : (
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  {messages.pageViewer.sourceUnavailable}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{messages.pageViewer.sourceDescription}</p>
          </div>

          <div className="min-w-0">
            <h4 className="mb-3 font-medium">{messages.pageViewer.extractedTextTitle}</h4>
            <div className="max-h-[34rem] overflow-y-auto whitespace-pre-wrap rounded-md border border-border/80 bg-background/60 p-5 font-serif text-[15px] leading-7 shadow-sm">
              {displayText || messages.pageViewer.noExtractedText}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/10 py-12 text-center shadow-sm">
          <ScrollText className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-medium">{messages.pageViewer.noPageSelected}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{messages.pageViewer.noPageSelectedDescription}</p>
        </div>
      )}
    </section>
  );
}
