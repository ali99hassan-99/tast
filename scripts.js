let subscriptionsData = [];

// دالة لتحميل البيانات من ملف Excel
function loadSubscriptions() {
    fetch('444.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            subscriptionsData = XLSX.utils.sheet_to_json(sheet, { raw: true });  // لا نقوم بتحويل التواريخ هنا مباشرة

            // تحويل التواريخ إلى تنسيق صالح
            subscriptionsData.forEach(subscription => {
                if (subscription["تاريخ الاشتراك"]) {
                    subscription["تاريخ الاشتراك"] = convertExcelDateToJSDate(subscription["تاريخ الاشتراك"]);
                }
            });

            // تحديث حالة الاشتراك بناءً على 30 يومًا من تاريخ الاشتراك
            updateSubscriptionStatus(subscriptionsData);

            // عرض البيانات في الجدول
            if (subscriptionsData.length > 0) {
                displaySubscriptions(subscriptionsData);
            } else {
                alert("لا توجد بيانات في الملف!");
            }
        })
        .catch(error => {
            console.error("خطأ في تحميل الملف:", error);
            alert("حدث خطأ أثناء تحميل الملف. تأكد من أن الملف موجود في الجذر!");
        });
}

// دالة لتحويل تاريخ Excel إلى تاريخ JavaScript
function convertExcelDateToJSDate(excelDate) {
    // إذا كان التاريخ في Excel هو رقم (مثلاً 44197 يعني 2021-01-01)
    if (typeof excelDate === 'number') {
        const unixEpoch = new Date(1899, 11, 30).getTime();  // 1899-12-30 هو التاريخ الأساسي في Excel
        const jsDate = new Date(unixEpoch + excelDate * 86400000);  // تحويل الرقم إلى تاريخ JavaScript
        return jsDate;
    }
    // إذا كان التاريخ بالفعل بتنسيق صحيح، نعيده كما هو
    return new Date(excelDate);
}

// دالة لتحديث حالة الاشتراك بناءً على 30 يومًا من تاريخ الاشتراك
function updateSubscriptionStatus(data) {
    const currentDate = new Date(); // تاريخ اليوم الميلادي

    data.forEach(subscription => {
        // تحويل تاريخ الاشتراك إلى كائن تاريخ صحيح
        let subscriptionDate = new Date(subscription["تاريخ الاشتراك"]);

        // التحقق من أن التاريخ صالح
        if (isNaN(subscriptionDate)) {
            console.error("تاريخ اشتراك غير صالح:", subscription["تاريخ الاشتراك"]);
            subscription["تاريخ الاشتراك"] = "غير صالح";
            subscription["حالة الاشتراك"] = "تاريخ غير صحيح";
            return;
        }

        // حساب تاريخ الانتهاء (بعد 30 يومًا من تاريخ الاشتراك)
        const expirationDate = new Date(subscriptionDate);
        expirationDate.setDate(expirationDate.getDate() + 30); // إضافة 30 يومًا للاشتراك

        // حفظ تاريخ الانتهاء
        subscription["تاريخ الانتهاء"] = expirationDate.toLocaleDateString("en-GB");

        // حساب الفرق بين تاريخ الاشتراك وتاريخ اليوم
        const daysDifference = Math.floor((currentDate - subscriptionDate) / (1000 * 3600 * 24));

        // تنسيق تاريخ الاشتراك ليظهر بشكل صحيح (ميلادي)
        subscription["تاريخ الاشتراك"] = subscriptionDate.toLocaleDateString("en-GB");

        // تحديد حالة الاشتراك بناءً على الفرق بين تاريخ الاشتراك وتاريخ اليوم
        if (daysDifference > 30) {
            subscription["حالة الاشتراك"] = `انتهى الاشتراك منذ ${daysDifference} يوم`;
        } else if (daysDifference > 0) {
            subscription["حالة الاشتراك"] = `باقٍ من الاشتراك ${30 - daysDifference} يوم`;
        } else if (daysDifference === 0) {
            subscription["حالة الاشتراك"] = "ينتهي اليوم";
        } else {
            subscription["حالة الاشتراك"] = `باقٍ من الاشتراك ${Math.abs(daysDifference)} يوم`;
        }
    });
}

// عرض البيانات في الجدول
function displaySubscriptions(data) {
    const tableContainer = document.getElementById("subscription-container");

    // إنشاء الجدول
    let table = `
        <table class="table">
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>تاريخ الاشتراك</th>
                    <th>تاريخ الانتهاء</th>
                    <th>حالة الاشتراك</th>
                    <th>رقم الهاتف</th>
                    <th>نوع الاشتراك</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;

    // إضافة كل صف من البيانات إلى الجدول
    data.forEach(subscription => {
        table += `
            <tr>
                <td>${subscription["الاســــــم"] || "غير محدد"}</td>
                <td>${subscription["تاريخ الاشتراك"] || "غير محدد"}</td>
                <td>${subscription["تاريخ الانتهاء"] || "غير محدد"}</td>
                <td>${subscription["حالة الاشتراك"] || "غير محدد"}</td>
                <td>${subscription["رقم الهاتف"] || "غير محدد"}</td>
                <td>${subscription["نوع الاشتراك"] || "غير محدد"}</td>
                <td>
                    <button onclick="renewSubscription('${subscription["الاســــــم"]}', true)">تجديد تلقائي</button>
                    <button onclick="renewSubscription('${subscription["الاســــــم"]}', false)">تجديد يدوي</button>
                </td>
            </tr>
        `;
    });

    table += `</tbody></table>`;

    // إضافة الجدول إلى الحاوية
    tableContainer.innerHTML = table;
}

// دالة لتجديد الاشتراك
function renewSubscription(name, isAutomatic) {
    const subscription = subscriptionsData.find(sub => sub["الاســــــم"] === name);
    if (!subscription) {
        alert("الاشتراك غير موجود!");
        return;
    }

    let newDate;

    if (isAutomatic) {
        // تجديد تلقائي: تعيين تاريخ اليوم
        newDate = new Date().toISOString().split('T')[0];  // الحصول على تاريخ اليوم بصيغة "YYYY-MM-DD"
    } else {
        // تجديد يدوي: طلب إدخال تاريخ من المستخدم
        newDate = prompt("أدخل تاريخ التجديد (YYYY-MM-DD):");
        if (!newDate || !isValidDate(newDate)) {
            alert("تاريخ غير صالح!");
            return;
        }
    }

    // تحديث تاريخ الاشتراك في البيانات
    subscription["تاريخ الاشتراك"] = newDate;

    // تحديث تاريخ الانتهاء بناءً على تاريخ الاشتراك (إضافة 30 يومًا)
    const subscriptionDate = new Date(newDate);
    const expirationDate = new Date(subscriptionDate);
    expirationDate.setDate(expirationDate.getDate() + 30);  // إضافة 30 يومًا للاشتراك

    // تحديث تاريخ الانتهاء
    subscription["تاريخ الانتهاء"] = expirationDate.toLocaleDateString("en-GB");

    // تحديث حالة الاشتراك بناءً على تاريخ الانتهاء
    updateSubscriptionStatus(subscriptionsData);

    // إعادة عرض الجدول مع البيانات المحدثة
    displaySubscriptions(subscriptionsData);
}

// دالة للتحقق من صلاحية التاريخ المدخل (YYYY-MM-DD)
function isValidDate(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
}

// دالة لعرض الاشتراكات المنتهية
function loadExpiredSubscriptions() {
    const expiredSubscriptions = subscriptionsData.filter(sub => {
        const subscriptionDate = new Date(sub["تاريخ الاشتراك"]);
        const daysDifference = Math.floor((new Date() - subscriptionDate) / (1000 * 3600 * 24));

        return daysDifference > 30;  // عرض الاشتراكات المنتهية منذ أكثر من 30 يومًا
    });
    displaySubscriptions(expiredSubscriptions);
}

// دالة لإضافة اشتراك جديد
function addSubscription() {
    const name = prompt("أدخل اسم الشخص:");
    const subscriptionDate = prompt("أدخل تاريخ الاشتراك (YYYY-MM-DD):");
    const phone = prompt("أدخل رقم الهاتف:");
    const subscriptionType = prompt("أدخل نوع الاشتراك:");

    if (name && subscriptionDate && phone && subscriptionType) {
        const newSubscription = {
            "الاســــــم": name,
            "تاريخ الاشتراك": subscriptionDate,
            "حالة الاشتراك": "باقٍ",
            "رقم الهاتف": phone,
            "نوع الاشتراك": subscriptionType
        };

        subscriptionsData.push(newSubscription);
        updateSubscriptionStatus(subscriptionsData);
        displaySubscriptions(subscriptionsData);
    } else {
        alert("يرجى ملء جميع الحقول.");
    }
}

// دالة لحذف اشتراك
function deleteSubscription() {
    const name = prompt("أدخل اسم الشخص لحذف الاشتراك:");

    const index = subscriptionsData.findIndex(sub => sub["الاســــــم"] === name);
    if (index !== -1) {
        subscriptionsData.splice(index, 1);
        updateSubscriptionStatus(subscriptionsData);
        displaySubscriptions(subscriptionsData);
    } else {
        alert("الاشتراك غير موجود.");
    }
}

// دالة للبحث عن اشتراك
function searchSubscription() {
    const searchQuery = prompt("أدخل اسم الشخص للبحث:");

    if (searchQuery) {
        const searchResults = subscriptionsData.filter(sub => sub["الاســــــم"].includes(searchQuery));
        if (searchResults.length > 0) {
            displaySubscriptions(searchResults);
        } else {
            alert("لا يوجد اشتراك بهذا الاسم.");
        }
    } else {
        alert("يرجى إدخال اسم للبحث.");
    }
}
