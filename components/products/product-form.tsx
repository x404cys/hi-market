"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createSlug,
  formatIqd,
  productStatusLabels,
  productUnitLabels,
} from "@/lib/products/product-format";
import {
  ProductImagesSection,
  cleanupProductImageKeys,
  createExistingProductImageItem,
  ensureProductImagePrimary,
  getProductImageUploadIssue,
  getRemovedExistingProductImageKeys,
  preparePendingProductImages,
  resetUploadedProductImagesByKeys,
  uploadPendingProductImages,
  type ProductImageFormItem,
  type ProductImageSaveStep,
} from "@/components/products/product-images";
import { QuickCreateCatalogDialog } from "@/components/products/quick-create-catalog-dialog";
import type {
  ApiErrorResponse,
  ApiSuccess,
  BrandOption,
  CategoryOption,
  ProductDto,
} from "@/lib/products/product-types";
import {
  createProductSchema,
  productStatusValues,
  productUnitValues,
  updateProductSchema,
} from "@/lib/validations/product";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ZodError } from "zod";

type ProductFormMode = "create" | "edit";
type LookupStatus = "loading" | "loaded" | "empty" | "error" | "creating";
type QuickCreateKind = "category" | "brand";

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brandId: string;
  price: string;
  comparePrice: string;
  unit: (typeof productUnitValues)[number];
  unitValue: string;
  isWeighted: boolean;
  minOrderQty: string;
  orderStep: string;
  stock: string;
  lowStockAt: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  image: string;
  images: ProductImageFormItem[];
  status: (typeof productStatusValues)[number];
  isFeatured: boolean;
};

type FieldErrors = Partial<Record<keyof ProductFormState | "form", string>>;

const defaultFormState: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  sku: "",
  barcode: "",
  categoryId: "",
  brandId: "",
  price: "",
  comparePrice: "",
  unit: "PIECE",
  unitValue: "",
  isWeighted: false,
  minOrderQty: "1",
  orderStep: "1",
  stock: "0",
  lowStockAt: "0",
  trackInventory: true,
  allowBackorder: false,
  image: "",
  images: [],
  status: "ACTIVE",
  isFeatured: false,
};

export function ProductForm({
  mode,
  productId,
}: {
  mode: ProductFormMode;
  productId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(defaultFormState);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [categoryLookupStatus, setCategoryLookupStatus] =
    useState<LookupStatus>("loading");
  const [brandLookupStatus, setBrandLookupStatus] =
    useState<LookupStatus>("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<ProductImageSaveStep>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [quickCreateKind, setQuickCreateKind] = useState<QuickCreateKind | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);
  const initialImagesRef = useRef<ProductImageFormItem[]>([]);
  const categoryAddButtonRef = useRef<HTMLButtonElement | null>(null);
  const brandAddButtonRef = useRef<HTMLButtonElement | null>(null);

  const loadCategories = useCallback(async () => {
    setCategoryLookupStatus("loading");
    setCategoryError(null);

    try {
      const data = await fetchCategoryOptions();
      setCategories(data);
      setCategoryLookupStatus(data.length > 0 ? "loaded" : "empty");
    } catch {
      setCategories([]);
      setCategoryError("تعذر تحميل التصنيفات.");
      setCategoryLookupStatus("error");
    }
  }, []);

  const loadBrands = useCallback(async () => {
    setBrandLookupStatus("loading");
    setBrandError(null);

    try {
      const data = await fetchBrandOptions();
      setBrands(data);
      setBrandLookupStatus(data.length > 0 ? "loaded" : "empty");
    } catch {
      setBrands([]);
      setBrandError("تعذر تحميل الماركات. يمكنك حفظ المنتج بدون ماركة.");
      setBrandLookupStatus("error");
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialCategories() {
      try {
        const data = await fetchCategoryOptions();
        if (!isActive) return;
        setCategories(data);
        setCategoryLookupStatus(data.length > 0 ? "loaded" : "empty");
      } catch {
        if (!isActive) return;
        setCategories([]);
        setCategoryError("تعذر تحميل التصنيفات.");
        setCategoryLookupStatus("error");
      }
    }

    async function loadInitialBrands() {
      try {
        const data = await fetchBrandOptions();
        if (!isActive) return;
        setBrands(data);
        setBrandLookupStatus(data.length > 0 ? "loaded" : "empty");
      } catch {
        if (!isActive) return;
        setBrands([]);
        setBrandError("تعذر تحميل الماركات. يمكنك حفظ المنتج بدون ماركة.");
        setBrandLookupStatus("error");
      }
    }

    void loadInitialCategories();
    void loadInitialBrands();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;

    let isActive = true;

    async function loadProduct() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/products/${productId}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as ApiSuccess<ProductDto> | ApiErrorResponse;

        if (!isActive) return;

        if (!json.success) {
          setLoadError(json.message || "تعذر تحميل المنتج.");
          return;
        }

        const nextForm = productToFormState(json.data);
        setForm(nextForm);
        initialImagesRef.current = nextForm.images;
      } catch {
        if (isActive) setLoadError("تعذر الاتصال بواجهة المنتجات.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [mode, productId]);

  const discountPercent = useMemo(() => {
    const price = Number(form.price);
    const comparePrice = Number(form.comparePrice);

    if (!Number.isFinite(price) || !Number.isFinite(comparePrice) || comparePrice <= price || comparePrice <= 0) {
      return null;
    }

    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }, [form.comparePrice, form.price]);
  const hasCategoryFallback = Boolean(
    form.categoryId && !categories.some((category) => category.id === form.categoryId),
  );
  const hasBrandFallback = Boolean(
    form.brandId && !brands.some((brand) => brand.id === form.brandId),
  );
  const isSubmitDisabled = isSaving;
  const submitLabel =
    saveStep === "compressing"
      ? "جاري ضغط الصور..."
      : saveStep === "uploading"
        ? "جاري رفع الصور..."
        : saveStep === "saving"
          ? "جاري حفظ المنتج..."
          : "حفظ المنتج";

  function setField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function setFirstErrorRef(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
    key: keyof ProductFormState,
  ) {
    if (element && errors[key] && !firstErrorRef.current) {
      firstErrorRef.current = element;
    }
  }

  function updateImages(
    updater: (images: ProductImageFormItem[]) => ProductImageFormItem[],
  ) {
    setForm((current) => {
      const images = ensureProductImagePrimary(updater(current.images));
      const primaryImage = images.find((image) => image.isPrimary);

      return {
        ...current,
        images,
        image: primaryImage?.url ?? "",
      };
    });
    setErrors((current) => ({ ...current, image: undefined, images: undefined, form: undefined }));
  }

  function handleCategoryCreated(category: CategoryOption, message: string) {
    setCategories((current) => upsertCategoryOption(current, category));
    setCategoryLookupStatus("loaded");
    setCategoryError(null);
    setField("categoryId", category.id);
    setToast(message);
  }

  function handleBrandCreated(brand: BrandOption, message: string) {
    setBrands((current) => upsertBrandOption(current, brand));
    setBrandLookupStatus("loaded");
    setBrandError(null);
    setField("brandId", brand.id);
    setToast(message);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    firstErrorRef.current = null;
    setErrors({});
    setIsSaving(true);

    const schema = mode === "create" ? createProductSchema : updateProductSchema;
    const uploadedKeys: string[] = [];
    let workingForm = form;

    try {
      setSaveStep("compressing");

      const preparedImages = await preparePendingProductImages(form.images);
      workingForm = applyImagesToForm(form, preparedImages);
      setForm((current) => applyImagesToForm(current, preparedImages));

      const imageIssue = getProductImageUploadIssue(preparedImages);
      if (imageIssue) {
        setErrors({ form: imageIssue });
        return;
      }

      const preUploadParsed = schema.safeParse(formToPayload(workingForm));
      if (!preUploadParsed.success) {
        const nextErrors = zodToFieldErrors(preUploadParsed.error);
        setErrors(nextErrors);
        requestAnimationFrame(() => firstErrorRef.current?.focus());
        return;
      }

      setSaveStep("uploading");

      const uploadResult = await uploadPendingProductImages(preparedImages, updateImages);
      uploadedKeys.push(...uploadResult.uploadedKeys);
      workingForm = applyImagesToForm(workingForm, uploadResult.images);
      setForm((current) => applyImagesToForm(current, uploadResult.images));

      setSaveStep("saving");

      const parsed = schema.safeParse(formToPayload(workingForm));
      if (!parsed.success) {
        await cleanupUploadedImagesForRetry(uploadedKeys, workingForm.images);
        const nextErrors = zodToFieldErrors(parsed.error);
        setErrors(nextErrors);
        requestAnimationFrame(() => firstErrorRef.current?.focus());
        return;
      }

      const response = await fetch(mode === "create" ? "/api/products" : `/api/products/${productId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json()) as ApiSuccess<ProductDto> | ApiErrorResponse;

      if (!json.success) {
        await cleanupUploadedImagesForRetry(uploadedKeys, workingForm.images);
        setErrors(apiErrorsToFieldErrors(json));
        return;
      }

      if (mode === "edit") {
        await cleanupProductImageKeys(
          getRemovedExistingProductImageKeys(initialImagesRef.current, workingForm.images),
        );
      }

      setToast(mode === "create" ? "تمت إضافة المنتج بنجاح" : "تم حفظ التعديلات بنجاح");
      window.setTimeout(() => router.push("/dashboard/products"), 650);
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await cleanupUploadedImagesForRetry(uploadedKeys, workingForm.images);
      }

      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "تعذر الاتصال بواجهة المنتجات.",
      });
    } finally {
      setSaveStep("idle");
      setIsSaving(false);
    }
  }

  async function cleanupUploadedImagesForRetry(
    keys: string[],
    imagesOverride?: ProductImageFormItem[],
  ) {
    if (keys.length === 0) return;

    await cleanupProductImageKeys(keys);
    setForm((current) => {
      const images = resetUploadedProductImagesByKeys(
        imagesOverride ?? current.images,
        keys,
      );

      return applyImagesToForm(current, images);
    });
  }

  if (isLoading) {
    return <ProductFormSkeleton />;
  }

  if (loadError && mode === "edit") {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">تعذر تحميل المنتج</h1>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/products">العودة للمنتجات</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-950">
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -mr-2 gap-2">
              <Link href="/dashboard/products">
                <ArrowRight className="size-4" />
                العودة للمنتجات
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-normal">
              {mode === "create" ? "إضافة منتج" : "تعديل المنتج"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "أدخل بيانات المنتج كما ستظهر في لوحة الإدارة والمتجر."
                : "عدّل بيانات المنتج والأسعار والمخزون من مكان واحد."}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/products">إلغاء</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled} className="gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitLabel}
            </Button>
          </div>
        </header>

        {toast && (
          <div className="fixed left-5 top-5 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700 shadow-lg">
            <CheckCircle2 className="size-4" />
            {toast}
          </div>
        )}

        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.form}</div>
        )}

        {loadError && mode === "create" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{loadError}</div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>معلومات المنتج</CardTitle>
                <CardDescription>الاسم والرابط والوصف المختصر.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4">
                <Field label="اسم المنتج" required error={errors.name}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "name")}
                    value={form.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setField("name", value);
                      if (mode === "create" && !form.slug) {
                        setField("slug", createSlug(value));
                      }
                    }}
                    className={inputClass(errors.name)}
                    placeholder="كوكا كولا 1.5 لتر"
                  />
                </Field>
                <Field label="Slug" required error={errors.slug} hint="استخدم أحرف إنجليزية صغيرة وأرقام وشرطات.">
                  <input
                    ref={(element) => setFirstErrorRef(element, "slug")}
                    value={form.slug}
                    onChange={(event) => setField("slug", createSlug(event.target.value))}
                    className={inputClass(errors.slug)}
                    dir="ltr"
                    placeholder="coca-cola-1-5l"
                  />
                </Field>
                <Field label="الوصف" error={errors.description}>
                  <textarea
                    ref={(element) => setFirstErrorRef(element, "description")}
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    className={`${inputClass(errors.description)} min-h-28 resize-y py-2`}
                    placeholder="وصف مختصر يساعد فريق الإدارة والعملاء على تمييز المنتج."
                  />
                </Field>
              </CardContent>
            </Card>

            <ProductImagesSection
              images={form.images}
              error={errors.image || errors.images}
              disabled={isSaving}
              onImagesChange={updateImages}
            />

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>التسعير</CardTitle>
                <CardDescription>الأسعار بالدينار العراقي.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <Field label="السعر" required error={errors.price}>
                  <MoneyInput
                    value={form.price}
                    onChange={(value) => setField("price", value)}
                    error={errors.price}
                    inputRef={(element) => setFirstErrorRef(element, "price")}
                  />
                </Field>
                <Field
                  label="السعر قبل الخصم"
                  error={errors.comparePrice}
                  hint={discountPercent ? `خصم ${discountPercent.toLocaleString("ar-IQ")}%` : undefined}
                >
                  <MoneyInput
                    value={form.comparePrice}
                    onChange={(value) => setField("comparePrice", value)}
                    error={errors.comparePrice}
                    inputRef={(element) => setFirstErrorRef(element, "comparePrice")}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>المخزون</CardTitle>
                <CardDescription>الكميات الحالية ومعرّفات التخزين والبيع.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <Field label="SKU" error={errors.sku}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "sku")}
                    value={form.sku}
                    onChange={(event) => setField("sku", event.target.value)}
                    className={inputClass(errors.sku)}
                    dir="ltr"
                    placeholder="CC-1500"
                  />
                </Field>
                <Field label="الباركود" error={errors.barcode}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "barcode")}
                    value={form.barcode}
                    onChange={(event) => setField("barcode", event.target.value)}
                    className={inputClass(errors.barcode)}
                    dir="ltr"
                    placeholder="123456789"
                  />
                </Field>
                <Field label="الكمية المتوفرة" error={errors.stock}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "stock")}
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.stock}
                    onChange={(event) => setField("stock", event.target.value)}
                    className={inputClass(errors.stock)}
                  />
                </Field>
                <Field label="حد المخزون المنخفض" error={errors.lowStockAt}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "lowStockAt")}
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.lowStockAt}
                    onChange={(event) => setField("lowStockAt", event.target.value)}
                    className={inputClass(errors.lowStockAt)}
                  />
                </Field>
                <ToggleField
                  checked={form.trackInventory}
                  onChange={(checked) => setField("trackInventory", checked)}
                  title="تتبع المخزون"
                  description="سجّل تغييرات الكمية ضمن سجل حركة المخزون."
                />
                <ToggleField
                  checked={form.allowBackorder}
                  onChange={(checked) => setField("allowBackorder", checked)}
                  title="السماح بالطلب عند النفاد"
                  description="اسمح باستقبال الطلبات حتى لو تجاوزت الكمية الحالية."
                />
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>الوحدة والقياس</CardTitle>
                <CardDescription>طريقة بيع المنتج والحد الأدنى للطلب.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <Field label="الوحدة" required error={errors.unit}>
                  <select
                    ref={(element) => setFirstErrorRef(element, "unit")}
                    value={form.unit}
                    onChange={(event) => setField("unit", event.target.value as ProductFormState["unit"])}
                    className={inputClass(errors.unit)}
                  >
                    {productUnitValues.map((unit) => (
                      <option key={unit} value={unit}>
                        {productUnitLabels[unit]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الحجم / الوزن" error={errors.unitValue}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "unitValue")}
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.unitValue}
                    onChange={(event) => setField("unitValue", event.target.value)}
                    className={inputClass(errors.unitValue)}
                    placeholder="1.5"
                  />
                </Field>
                <Field label="أقل كمية للطلب" error={errors.minOrderQty}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "minOrderQty")}
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.minOrderQty}
                    onChange={(event) => setField("minOrderQty", event.target.value)}
                    className={inputClass(errors.minOrderQty)}
                  />
                </Field>
                <Field label="خطوة الزيادة" error={errors.orderStep}>
                  <input
                    ref={(element) => setFirstErrorRef(element, "orderStep")}
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.orderStep}
                    onChange={(event) => setField("orderStep", event.target.value)}
                    className={inputClass(errors.orderStep)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <ToggleField
                    checked={form.isWeighted}
                    onChange={(checked) => setField("isWeighted", checked)}
                    title="يباع بالوزن"
                    description="فعّل هذا الخيار للمنتجات التي يمكن طلب كمية جزئية منها، مثل الخضروات والفواكه واللحوم."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>الحالة والتنظيم</CardTitle>
                <CardDescription>حدد ظهور المنتج وتصنيفه.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-4">
                <Field label="حالة المنتج" required error={errors.status}>
                  <div className="grid grid-cols-2 gap-2">
                    {productStatusValues.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setField("status", status)}
                        className={`flex h-10 items-center justify-center rounded-md border text-sm transition ${
                          form.status === status
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {productStatusLabels[status]}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="التصنيف" required error={errors.categoryId}>
                  <select
                    ref={(element) => setFirstErrorRef(element, "categoryId")}
                    value={form.categoryId}
                    onChange={(event) => setField("categoryId", event.target.value)}
                    className={inputClass(errors.categoryId)}
                    disabled={categoryLookupStatus === "loading" && categories.length === 0}
                  >
                    <option value="">
                      {categoryLookupStatus === "loading"
                        ? "جاري تحميل التصنيفات..."
                        : categories.length === 0
                          ? "لا توجد تصنيفات بعد"
                          : "اختر التصنيف"}
                    </option>
                    {hasCategoryFallback && (
                      <option value={form.categoryId}>التصنيف الحالي</option>
                    )}
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {categoryLookupStatus === "loaded" && (
                  <QuickCreateInlineAction
                    ref={categoryAddButtonRef}
                    label="+ إضافة تصنيف جديد"
                    onClick={() => setQuickCreateKind("category")}
                  />
                )}
                {categoryLookupStatus === "empty" && (
                  <LookupMessage
                    message="لا توجد تصنيفات بعد."
                    actionLabel="+ إضافة أول تصنيف"
                    onAction={() => setQuickCreateKind("category")}
                    actionRef={categoryAddButtonRef}
                  />
                )}
                {categoryLookupStatus === "error" && (
                  <LookupMessage
                    message={categoryError ?? "تعذر تحميل التصنيفات."}
                    isLoading={false}
                    onRetry={() => void loadCategories()}
                    actionLabel="+ إضافة تصنيف جديد"
                    onAction={() => setQuickCreateKind("category")}
                    actionRef={categoryAddButtonRef}
                  />
                )}

                <Field label="الماركة" error={errors.brandId}>
                  <select
                    ref={(element) => setFirstErrorRef(element, "brandId")}
                    value={form.brandId}
                    onChange={(event) => setField("brandId", event.target.value)}
                    className={inputClass(errors.brandId)}
                  >
                    <option value="">بدون ماركة</option>
                    {hasBrandFallback && (
                      <option value={form.brandId}>الماركة الحالية</option>
                    )}
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {brandLookupStatus === "loaded" && (
                  <QuickCreateInlineAction
                    ref={brandAddButtonRef}
                    label="+ إضافة ماركة جديدة"
                    onClick={() => setQuickCreateKind("brand")}
                  />
                )}
                {brandLookupStatus === "empty" && (
                  <LookupMessage
                    message="لا توجد ماركات بعد. يمكنك حفظ المنتج بدون ماركة."
                    actionLabel="+ إضافة أول ماركة"
                    onAction={() => setQuickCreateKind("brand")}
                    actionRef={brandAddButtonRef}
                  />
                )}
                {brandLookupStatus === "error" && (
                  <LookupMessage
                    message={brandError ?? "تعذر تحميل الماركات."}
                    isLoading={false}
                    onRetry={() => void loadBrands()}
                    actionLabel="+ إضافة ماركة جديدة"
                    onAction={() => setQuickCreateKind("brand")}
                    actionRef={brandAddButtonRef}
                  />
                )}

                <ToggleField
                  checked={form.isFeatured}
                  onChange={(checked) => setField("isFeatured", checked)}
                  title="منتج مميز"
                  description="اعرض المنتج ضمن مناطق المنتجات المميزة عند توفرها."
                />
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">السعر الحالي</span>
                  <strong className="text-base">{formatIqd(form.price || 0)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">الحالة</span>
                  <Badge variant="outline">{productStatusLabels[form.status]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">المخزون</span>
                  <strong className="text-base">{form.stock || "0"}</strong>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-7xl justify-end gap-2">
            <Button type="button" variant="outline" asChild className="flex-1">
              <Link href="/dashboard/products">إلغاء</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled} className="flex-1 gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
      {quickCreateKind === "category" && (
        <QuickCreateCatalogDialog
          kind="category"
          returnFocusRef={categoryAddButtonRef}
          onClose={() => setQuickCreateKind(null)}
          onCreated={(item, message) =>
            handleCategoryCreated(item as CategoryOption, message)
          }
        />
      )}
      {quickCreateKind === "brand" && (
        <QuickCreateCatalogDialog
          kind="brand"
          returnFocusRef={brandAddButtonRef}
          onClose={() => setQuickCreateKind(null)}
          onCreated={(item, message) =>
            handleBrandCreated(item as BrandOption, message)
          }
        />
      )}
    </main>
  );
}

function MoneyInput({
  value,
  onChange,
  error,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputRef?: (element: HTMLInputElement | null) => void;
}) {
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass(error)} pl-12`}
      />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">د.ع</span>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function ToggleField({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
      <span>
        <span className="block text-sm font-medium text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 rounded border-slate-300 accent-slate-950"
      />
    </label>
  );
}

const QuickCreateInlineAction = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    onClick: () => void;
  }
>(function QuickCreateInlineAction({ label, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="-mt-2 flex w-fit items-center gap-1 text-xs font-medium text-slate-700 transition hover:text-slate-950"
    >
      <Plus className="size-3.5" />
      {label}
    </button>
  );
});

function LookupMessage({
  message,
  isLoading,
  onRetry,
  actionLabel,
  onAction,
  actionRef,
}: {
  message: string;
  isLoading?: boolean;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="-mt-2 grid gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <span>{message}</span>
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 bg-white px-2 text-xs"
            disabled={isLoading}
            onClick={onRetry}
          >
            {isLoading ? <Loader2 className="ml-1 size-3 animate-spin" /> : null}
            إعادة المحاولة
          </Button>
        )}
        {actionLabel && onAction && (
          <Button
            ref={actionRef}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 bg-white px-2 text-xs"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function ProductFormSkeleton() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-lg border-slate-200 shadow-none">
              <CardContent className="space-y-4 p-4">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-10 animate-pulse rounded bg-slate-100" />
                <div className="h-10 animate-pulse rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="h-80 rounded-lg border-slate-200 shadow-none">
          <CardContent className="space-y-4 p-4">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function inputClass(error?: string) {
  return `h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
  }`;
}

function applyImagesToForm(
  form: ProductFormState,
  images: ProductImageFormItem[],
): ProductFormState {
  const nextImages = ensureProductImagePrimary(images);

  return {
    ...form,
    images: nextImages,
    image: nextImages.find((image) => image.isPrimary)?.url ?? "",
  };
}

async function fetchCategoryOptions() {
  const response = await fetch("/api/categories", { cache: "no-store" });
  const json = (await response.json()) as
    | ApiSuccess<CategoryOption[]>
    | ApiErrorResponse;

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}

async function fetchBrandOptions() {
  const response = await fetch("/api/brands", { cache: "no-store" });
  const json = (await response.json()) as
    | ApiSuccess<BrandOption[]>
    | ApiErrorResponse;

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}

function upsertCategoryOption(
  categories: CategoryOption[],
  category: CategoryOption,
) {
  if (categories.some((item) => item.id === category.id)) {
    return categories.map((item) => (item.id === category.id ? category : item));
  }

  return [...categories, category];
}

function upsertBrandOption(brands: BrandOption[], brand: BrandOption) {
  if (brands.some((item) => item.id === brand.id)) {
    return brands.map((item) => (item.id === brand.id ? brand : item));
  }

  return [...brands, brand];
}

function formToPayload(form: ProductFormState) {
  const savedImages = ensureProductImagePrimary(form.images).filter(
    (image) =>
      image.url &&
      (image.status === "existing" || image.status === "uploaded"),
  );
  const primaryImage = savedImages.find((image) => image.isPrimary);

  return {
    name: form.name,
    slug: form.slug,
    description: nullableString(form.description),
    sku: nullableString(form.sku),
    barcode: nullableString(form.barcode),
    categoryId: form.categoryId,
    brandId: form.brandId ? form.brandId : null,
    price: form.price,
    comparePrice: nullableString(form.comparePrice),
    unit: form.unit,
    unitValue: nullableString(form.unitValue),
    isWeighted: form.isWeighted,
    minOrderQty: form.minOrderQty,
    orderStep: form.orderStep,
    stock: form.stock,
    lowStockAt: form.lowStockAt,
    trackInventory: form.trackInventory,
    allowBackorder: form.allowBackorder,
    image: primaryImage?.url ?? null,
    images: savedImages.filter((image) => !image.isPrimary).map((image, index) => ({
      url: image.url,
      sortOrder: index,
    })),
    status: form.status,
    isFeatured: form.isFeatured,
  };
}

function productToFormState(product: ProductDto): ProductFormState {
  const imageItems = ensureProductImagePrimary([
    ...(product.image
      ? [
          createExistingProductImageItem(product.image, {
            id: `primary-${product.id}`,
            isPrimary: true,
            fileName: product.name,
          }),
        ]
      : []),
    ...product.images
      .filter((image) => image.url !== product.image)
      .map((image) =>
        createExistingProductImageItem(image.url, {
          id: image.id,
          isPrimary: false,
          fileName: image.alt ?? product.name,
        }),
      ),
  ]);

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    price: product.price,
    comparePrice: product.comparePrice ?? "",
    unit: product.unit,
    unitValue: product.unitValue ?? "",
    isWeighted: product.isWeighted,
    minOrderQty: product.minOrderQty,
    orderStep: product.orderStep,
    stock: product.stock,
    lowStockAt: product.lowStockAt,
    trackInventory: product.trackInventory,
    allowBackorder: product.allowBackorder,
    image: imageItems.find((image) => image.isPrimary)?.url ?? "",
    images: imageItems,
    status: product.status,
    isFeatured: product.isFeatured,
  };
}

function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function zodToFieldErrors(error: ZodError): FieldErrors {
  const nextErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (nextErrors[key as keyof ProductFormState]) continue;
    nextErrors[key as keyof ProductFormState] = translateValidationMessage(issue.message);
  }

  if (Object.keys(nextErrors).length === 0) {
    nextErrors.form = "تحقق من الحقول المطلوبة ثم حاول مرة أخرى.";
  }

  return nextErrors;
}

function apiErrorsToFieldErrors(error: ApiErrorResponse): FieldErrors {
  const nextErrors: FieldErrors = {};

  if (error.errors) {
    for (const [key, messages] of Object.entries(error.errors)) {
      const message = firstApiErrorMessage(messages);
      if (message) nextErrors[key as keyof ProductFormState] = translateValidationMessage(message);
    }
  }

  if (Object.keys(nextErrors).length === 0) {
    nextErrors.form = translateApiMessage(error.message);
  }

  return nextErrors;
}

function firstApiErrorMessage(value: unknown) {
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  if (typeof value === "string") return value;
  return null;
}

function translateValidationMessage(message: string) {
  if (message.startsWith("Must be a decimal with at most")) {
    return "أدخل رقماً صحيحاً بالتنسيق المطلوب";
  }

  const messages: Record<string, string> = {
    Required: "هذا الحقل مطلوب",
    "Invalid id": "القيمة المحددة غير صالحة",
    "Must be greater than 0": "يجب أن تكون القيمة أكبر من صفر",
    "Must be greater than or equal to 0": "يجب ألا تكون القيمة سالبة",
    "Slug must contain lowercase letters, numbers, and hyphens only":
      "استخدم أحرف إنجليزية صغيرة وأرقام وشرطات فقط",
  };

  return messages[message] ?? message;
}

function translateApiMessage(message: string) {
  const messages: Record<string, string> = {
    "Category not found": "التصنيف المحدد غير موجود",
    "Brand not found": "الماركة المحددة غير موجودة",
    "Product slug already exists": "رابط المنتج مستخدم مسبقاً",
    "Product SKU already exists": "رمز SKU مستخدم مسبقاً",
    "Product barcode already exists": "الباركود مستخدم مسبقاً",
    "Product not found": "المنتج غير موجود",
    "Internal server error": "حدث خطأ في الخادم",
  };

  return messages[message] ?? message;
}
