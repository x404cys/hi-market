"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Loader2, Package, Save, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { formatIqd } from "@/lib/products/product-format";
import { calculatePrice, MAX_PRICE_UPDATES, samePrice, validPrice, type PriceEdit, type PriceOperation, type PriceProduct } from "@/lib/products/price-editor";

const fieldClass = "h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";
type PageData = { products: PriceProduct[]; totalPages: number; total: number };

export function QuickPriceEditor() {
  const [data, setData] = useState<PageData>({ products: [], totalPages: 0, total: 0 });
  const [edits, setEdits] = useState<Record<string, PriceEdit>>({});
  const [selected, setSelected] = useState<Record<string, PriceProduct>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [categoryRetry, setCategoryRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [changedOnly, setChangedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const saveLock = useRef(false);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const count = Object.keys(edits).length;
  const invalidCount = Object.values(edits).filter((edit) => !validPrice(edit.value)).length;

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setCategoryError(false);
      try {
        const response = await fetch("/api/categories", { signal: controller.signal, cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error();
        setCategories(json.data);
      } catch { if (!controller.signal.aborted) setCategoryError(true); }
    }
    void load();
    return () => controller.abort();
  }, [categoryRetry]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (changedOnly) { setLoading(false); return; }
      setLoading(true); setLoadError("");
      const params = new URLSearchParams({ page: String(page), search: query });
      if (categoryId) params.set("categoryId", categoryId);
      try {
        const response = await fetch(`/api/products/bulk-prices?${params}`, { signal: controller.signal, cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message || "تعذر تحميل المنتجات");
        if (controller.signal.aborted) return;
        setData({ products: json.data, totalPages: json.pagination.totalPages, total: json.pagination.total });
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "تعذر تحميل المنتجات");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [page, query, categoryId, refresh, changedOnly]);

  useEffect(() => {
    if (!count) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [count]);

  const changedProducts = Object.values(edits).map((edit) => edit.product)
    .filter((product) => (!categoryId || product.categoryId === categoryId) && product.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const totalPages = changedOnly ? Math.ceil(changedProducts.length / 50) : data.totalPages;
  const effectivePage = Math.min(page, Math.max(1, totalPages));
  const visible = changedOnly ? changedProducts.slice((effectivePage - 1) * 50, effectivePage * 50) : data.products;

  function editPrices(changes: { product: PriceProduct; value: string }[]) {
    const next = { ...edits };
    for (const { product, value } of changes) {
      const original = next[product.id]?.product ?? product;
      if (samePrice(original.price, value)) delete next[product.id];
      else next[product.id] = { product: original, value };
    }
    if (Object.keys(next).length > MAX_PRICE_UPDATES) {
      setError(`يمكن حفظ ${MAX_PRICE_UPDATES} تغيير في الدفعة الواحدة. احفظ التغييرات الحالية أولاً.`); return;
    }
    setEdits(next); setError(""); setToast("");
  }

  async function save() {
    if (saveLock.current || !count || invalidCount) return;
    saveLock.current = true; setSaving(true); setError(""); setToast("");
    const updates = Object.entries(edits).map(([id, edit]) => ({ id, price: edit.value.trim() }));
    try {
      const response = await fetch("/api/products/bulk-prices", { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || "تعذر حفظ الأسعار. حاول مرة أخرى.");
      const prices = new Map<string, string>(json.data.updates.map((update: { id: string; price: string }) => [update.id, update.price]));
      setData((current) => ({ ...current, products: current.products.map((product) => ({ ...product, price: prices.get(product.id) ?? product.price })) }));
      setEdits({}); setSelected({});
      setToast(`تم تحديث أسعار ${json.data.updatedCount} منتج`);
      setRefresh((value) => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر حفظ الأسعار. حاول مرة أخرى."); }
    finally { setSaving(false); saveLock.current = false; }
  }

  function selectProducts(products: PriceProduct[], checked: boolean) {
    const next = { ...selected };
    for (const product of products) { if (checked) next[product.id] = product; else delete next[product.id]; }
    if (Object.keys(next).length > MAX_PRICE_UPDATES) { setError(`الحد الأقصى للتحديد ${MAX_PRICE_UPDATES} منتج`); return; }
    setSelected(next);
  }

  const saveButton = <Button onClick={save} disabled={!count || !!invalidCount || saving} className="h-11 w-full gap-2 rounded-md sm:h-9 sm:w-auto">
    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
    {saving ? "جاري الحفظ..." : `حفظ ${count} تغيير`}
  </Button>;

  return <main dir="rtl" className="min-h-screen bg-[#f8fafc] pb-28 text-slate-950 sm:pb-8">
    <div className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:sticky sm:top-16 sm:z-20 sm:bg-[#f8fafc] sm:py-3">
        <div><Link href="/dashboard/products" onClick={(event) => { if (count && !window.confirm("لديك تغييرات غير محفوظة. هل تريد المغادرة؟")) event.preventDefault(); }} className="text-sm text-slate-500">المنتجات</Link>
          <h1 className="mt-1 text-xl font-semibold">تحديث الأسعار السريع</h1></div>
        <div className="hidden sm:block">{saveButton}</div>
      </header>
      {toast && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{toast}</div>}
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {invalidCount > 0 && <p role="alert" className="text-sm text-red-700">صحح أسعار {invalidCount} منتج قبل الحفظ.</p>}
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-[1_1_240px]"><span className="sr-only">البحث عن منتج</span><Search className="pointer-events-none absolute right-3 top-3 size-4 text-slate-400" />
            <input className={`${fieldClass} w-full pr-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="البحث عن منتج..." maxLength={200} /></label>
          <select aria-label="التصنيف" className={`${fieldClass} w-full sm:w-48`} value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
            <option value="">كل التصنيفات</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={changedOnly} onChange={(event) => { setChangedOnly(event.target.checked); setPage(1); }} className="size-4 accent-emerald-600" />المعدلة فقط</label>
        </div>
        {categoryError && <div className="flex items-center gap-2 text-sm text-red-700">تعذر تحميل التصنيفات<Button variant="outline" onClick={() => setCategoryRetry((value) => value + 1)}>إعادة المحاولة</Button></div>}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <span aria-live="polite">{count} تغييرات · {Object.keys(selected).length} محدد</span>
          <BulkPriceTool selected={Object.values(selected)} edits={edits} onApply={editPrices} disabled={saving} />
        </div>
        {!changedOnly && loadError ? <div role="alert" className="flex flex-wrap items-center gap-3 py-6 text-sm text-red-700">{loadError}<Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>إعادة المحاولة</Button></div>
          : loading && !changedOnly ? <div aria-label="جاري تحميل المنتجات" aria-busy="true" className="space-y-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-md bg-slate-200/60" />)}</div>
          : <div role="table" aria-label="أسعار المنتجات" className="border-y border-slate-200 bg-white">
            <div role="row" className="grid grid-cols-[24px_1fr] items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium text-slate-600 md:grid-cols-[24px_minmax(0,1fr)_130px_160px_100px]">
              <span role="columnheader"><input aria-label="تحديد المنتجات الظاهرة" type="checkbox" className="size-4 accent-emerald-600" checked={visible.length > 0 && visible.every((product) => !!selected[product.id])} onChange={(event) => selectProducts(visible, event.target.checked)} /></span>
              <span role="columnheader">المنتج</span><span role="columnheader" className="hidden md:block">السعر الحالي</span><span role="columnheader" className="hidden md:block">السعر الجديد</span><span role="columnheader" className="hidden md:block">الحالة</span>
            </div>
            {!visible.length && <p className="py-12 text-center text-sm text-slate-500">{changedOnly ? "لا توجد منتجات معدلة تطابق البحث" : "لا توجد منتجات تطابق البحث"}</p>}
            {visible.map((product, index) => {
              const edit = edits[product.id];
              const invalid = !!edit && !validPrice(edit.value);
              return <div role="row" key={product.id} className={`grid grid-cols-[24px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-slate-100 p-3 last:border-0 md:grid-cols-[24px_minmax(0,1fr)_130px_160px_100px] ${edit ? "bg-emerald-50/40" : ""}`}>
                <span role="cell"><input aria-label={`تحديد ${product.name}`} type="checkbox" checked={!!selected[product.id]} onChange={(event) => selectProducts([product], event.target.checked)} className="size-4 accent-emerald-600" /></span>
                <div role="cell" className="flex min-w-0 items-center gap-3"><PriceImage image={product.image} name={product.name} /><div className="min-w-0"><p className="break-words text-sm font-medium">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.category.name}</p></div></div>
                <div role="cell" className="col-start-2 text-sm md:col-start-auto"><span className="ml-2 text-xs text-slate-500 md:hidden">السعر الحالي</span>{formatIqd(edit?.product.price ?? product.price)}</div>
                <div role="cell" className="col-start-2 min-w-0 md:col-start-auto"><label htmlFor={`price-${product.id}`} className="mb-1 block text-xs text-slate-500 md:sr-only">السعر الجديد<span className="sr-only"> · {product.name}</span></label>
                  <input id={`price-${product.id}`} data-price-id={product.id} ref={(element) => { if (element) inputs.current.set(product.id, element); else inputs.current.delete(product.id); }}
                    dir="ltr" inputMode="decimal" autoComplete="off" maxLength={15} aria-invalid={invalid} aria-describedby={invalid ? `error-${product.id}` : undefined}
                    className={`${fieldClass} w-full text-right tabular-nums ${invalid ? "border-red-500" : ""}`} value={edit?.value ?? product.price}
                    onFocus={(event) => event.target.select()} onChange={(event) => editPrices([{ product, value: event.target.value }])}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                      event.preventDefault();
                      const next = visible[index + (event.key === "ArrowUp" ? -1 : 1)];
                      if (next) { const input = inputs.current.get(next.id); input?.focus(); input?.select(); }
                    }} />
                  {invalid && <p id={`error-${product.id}`} className="mt-1 text-xs text-red-700">أدخل سعراً موجباً بمنزلتين عشريتين كحد أقصى</p>}
                </div>
                <div role="cell" className="col-start-2 min-h-4 text-xs text-emerald-700 md:col-start-auto">{edit && <span className="inline-flex items-center gap-1"><Check className="size-3" />تم التعديل</span>}</div>
              </div>;
            })}
          </div>}
        <nav aria-label="صفحات المنتجات" className="flex items-center justify-between gap-2 text-sm">
          <Button variant="outline" disabled={effectivePage <= 1 || loading} onClick={() => setPage(effectivePage - 1)} aria-label="الصفحة السابقة"><ChevronRight className="size-4" /></Button>
          <span>{effectivePage} / {Math.max(1, totalPages)} · {changedOnly ? changedProducts.length : data.total} منتج</span>
          <Button variant="outline" disabled={effectivePage >= totalPages || loading} onClick={() => setPage(effectivePage + 1)} aria-label="الصفحة التالية"><ChevronLeft className="size-4" /></Button>
        </nav>
      </fieldset>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-end border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:hidden">{saveButton}</div>
  </main>;
}

function PriceImage({ image, name }: { image: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-white">
    {image && !failed ? <Image src={image} alt={name} fill sizes="48px" className="object-contain" onError={() => setFailed(true)} /> : <Package className="size-5 text-slate-400" />}
  </div>;
}

function BulkPriceTool({ selected, edits, onApply, disabled }: {
  selected: PriceProduct[]; edits: Record<string, PriceEdit>;
  onApply: (changes: { product: PriceProduct; value: string }[]) => void; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<PriceOperation>("set");
  const [amount, setAmount] = useState("");
  const preview = selected.map((product) => {
    const current = edits[product.id]?.value ?? product.price;
    return { product, current, value: calculatePrice(current, amount, operation) };
  });
  const valid = preview.length > 0 && preview.every((item) => item.value !== null);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="outline" disabled={!selected.length || disabled} className="gap-2"><SlidersHorizontal className="size-4" />تعديل جماعي</Button></SheetTrigger>
    <SheetContent dir="rtl" className="sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[560px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border">
      <SheetHeader><SheetTitle>تعديل جماعي</SheetTitle><SheetDescription>سيتم تعديل {selected.length} منتجات</SheetDescription></SheetHeader>
      <div className="space-y-4 overflow-y-auto px-5 pb-2">
        <label className="block space-y-2 text-sm"><span>نوع التعديل</span><select aria-label="نوع التعديل" className={`${fieldClass} w-full`} value={operation} onChange={(event) => setOperation(event.target.value as PriceOperation)}>
          <option value="set">تحديد سعر ثابت</option><option value="add">زيادة مبلغ ثابت</option><option value="subtract">خصم مبلغ ثابت</option><option value="increasePercent">زيادة بنسبة مئوية</option><option value="decreasePercent">خصم بنسبة مئوية</option>
        </select></label>
        <label className="block space-y-2 text-sm"><span>{operation.endsWith("Percent") ? "النسبة %" : "المبلغ د.ع"}</span><input dir="ltr" inputMode="decimal" className={`${fieldClass} w-full`} value={amount} maxLength={15} onChange={(event) => setAmount(event.target.value)} /></label>
        <div className="divide-y border-y border-slate-200" aria-label="معاينة الأسعار">{preview.map(({ product, current, value }) => <div key={product.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="min-w-0 break-words">{product.name}</span><span className="inline-flex items-center gap-2 text-emerald-700"><bdi>{formatIqd(current)}</bdi><ChevronLeft aria-hidden="true" className="size-3 shrink-0" /><bdi>{value === null ? "غير صالح" : formatIqd(value)}</bdi></span></div>)}</div>
        {amount && !valid && <p role="alert" className="text-sm text-red-700">ينتج عن هذا التعديل سعر غير صالح. راجع المبلغ والأسعار المحددة.</p>}
      </div>
      <SheetFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button disabled={!valid} onClick={() => { onApply(preview.map((item) => ({ product: item.product, value: item.value! }))); setOpen(false); }}>تطبيق</Button></SheetFooter>
    </SheetContent>
  </Sheet>;
}
