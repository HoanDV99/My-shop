// Mock Data
let products = [
    {
        id: 1,
        name: 'Táo Xanh N New Zealand',
        price: 85000,
        stock: 45,
        category: 'Trái cây',
        image: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400&q=80'
    },
    {
        id: 2,
        name: 'Thịt Bò Mỹ Cắt Lát',
        price: 250000,
        stock: 12,
        category: 'Thịt',
        image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400&q=80'
    },
    {
        id: 3,
        name: 'Sữa Tươi TH True Milk 1L',
        price: 35000,
        stock: 0,
        category: 'Đồ uống',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'
    },
    {
        id: 4,
        name: 'Bắp Cải Đà Lạt',
        price: 20000,
        stock: 120,
        category: 'Rau củ',
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80'
    },
    {
        id: 5,
        name: 'Cam Vàng Navel Úc',
        price: 95000,
        stock: 30,
        category: 'Trái cây',
        image: 'https://images.unsplash.com/photo-1528659223707-16d7a46c3104?w=400&q=80'
    },
    {
        id: 6,
        name: 'Cá Hồi Na Uy Cắt Lát',
        price: 450000,
        stock: 8,
        category: 'Thịt',
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80'
    }
];

// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

// Modal Elements
const modal = document.getElementById('productModal');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');

// Inputs
const idInput = document.getElementById('productId');
const nameInput = document.getElementById('productName');
const priceInput = document.getElementById('productPrice');
const stockInput = document.getElementById('productStock');
const categoryInput = document.getElementById('productCategory');
const imageInput = document.getElementById('productImage');

// Format Currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Determine Stock Status
const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Hết hàng', class: 'out-of-stock', icon: 'ph-warning-circle' };
    if (stock < 15) return { label: 'Sắp hết', class: 'low-stock', icon: 'ph-warning' };
    return { label: 'Còn hàng', class: 'in-stock', icon: 'ph-check-circle' };
};

// Render Products
const renderProducts = (productsToRender) => {
    productGrid.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="ph ph-package" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Không tìm thấy sản phẩm nào.</p>
            </div>
        `;
        return;
    }

    productsToRender.forEach(product => {
        const stockStatus = getStockStatus(product.stock);
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Default image fallback
        const fallbackImg = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
        const imgUrl = product.image || fallbackImg;

        card.innerHTML = `
            <div class="product-badge">${product.category}</div>
            <img class="product-image" src="${imgUrl}" alt="${product.name}" onerror="this.src='${fallbackImg}'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${formatCurrency(product.price)}</div>
                
                <div class="product-meta">
                    <span class="stock-status ${stockStatus.class}">
                        <i class="ph ${stockStatus.icon}"></i>
                        ${product.stock > 0 ? product.stock + ' (SP)' : stockStatus.label}
                    </span>
                    <span>#${product.id.toString().padStart(4, '0')}</span>
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-edit" onclick="editProduct(${product.id})">
                        <i class="ph ph-pencil-simple"></i> Sửa
                    </button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="ph ph-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
};

// Filter and Search
const filterProducts = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
};

// Initial Render
renderProducts(products);

// Event Listeners for Filters
searchInput.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);

// Modal Logic
const openModal = (isEdit = false) => {
    modalTitle.textContent = isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới';
    modal.classList.add('active');
};

const closeModal = () => {
    modal.classList.remove('active');
    productForm.reset();
    idInput.value = '';
};

openAddModalBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// Form Submit (Add / Edit)
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = idInput.value ? parseInt(idInput.value) : Date.now();
    const newProduct = {
        id: id,
        name: nameInput.value,
        price: parseInt(priceInput.value),
        stock: parseInt(stockInput.value),
        category: categoryInput.value,
        image: imageInput.value
    };

    if (idInput.value) {
        // Edit
        const index = products.findIndex(p => p.id === id);
        if(index !== -1) products[index] = newProduct;
        showToast('Đã cập nhật sản phẩm!');
    } else {
        // Add
        products.unshift(newProduct);
        showToast('Đã thêm sản phẩm mới!');
    }

    closeModal();
    filterProducts(); // Re-render with current filters
});

// Edit & Delete Functions (Attached globally)
window.editProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    idInput.value = product.id;
    nameInput.value = product.name;
    priceInput.value = product.price;
    stockInput.value = product.stock;
    categoryInput.value = product.category;
    imageInput.value = product.image;

    openModal(true);
};

window.deleteProduct = (id) => {
    if(confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        products = products.filter(p => p.id !== id);
        filterProducts();
        showToast('Đã xóa sản phẩm!');
    }
};

// Toast Notification
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

const showToast = (message) => {
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// Mobile Sidebar Logic
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Click outside sidebar on mobile to close
document.addEventListener('click', (e) => {
    if(window.innerWidth <= 768) {
        if(!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});
