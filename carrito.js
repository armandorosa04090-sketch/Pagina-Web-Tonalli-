(function () {
    const STORAGE_KEY = 'tonalliCart';
    const PHONE_NUMBER = '50362135729';

    function getCart() {
        try {
            const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(savedCart) ? savedCart : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    function updateCartBadge() {
        const countEl = document.getElementById('cart-count');
        if (!countEl) return;

        const cart = getCart();
        const totalItems = cart.reduce(function (sum, item) {
            return sum + item.quantity;
        }, 0);

        countEl.textContent = totalItems;
    }

    function renderCart() {
        const cart = getCart();
        const list = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');

        if (!list || !totalEl) return;

        if (!cart.length) {
            list.innerHTML = '<li class="empty-cart">Tu carrito está vacío.</li>';
            totalEl.textContent = formatCurrency(0);
            updateCartBadge();
            return;
        }

        const total = cart.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        list.innerHTML = cart.map(function (item) {
            return (
                '<li class="cart-item">' +
                    '<div>' +
                        '<p class="cart-item__name">' + item.name + '</p>' +
                        '<p class="cart-item__meta">' + formatCurrency(item.price) + ' cada uno</p>' +
                    '</div>' +
                    '<div class="cart-item__controls">' +
                        '<button type="button" class="qty-btn" data-action="decrease" data-name="' + encodeURIComponent(item.name) + '">-</button>' +
                        '<span>' + item.quantity + '</span>' +
                        '<button type="button" class="qty-btn" data-action="increase" data-name="' + encodeURIComponent(item.name) + '">+</button>' +
                    '</div>' +
                '</li>'
            );
        }).join('');

        totalEl.textContent = formatCurrency(total);
        updateCartBadge();
    }

    function addItemToCart(name, price) {
        const cart = getCart();
        const existingItem = cart.find(function (item) {
            return item.name.toLowerCase() === name.toLowerCase();
        });

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name: name,
                price: Number(price),
                quantity: 1
            });
        }

        saveCart(cart);
        renderCart();
    }

    function updateItemQuantity(name, action) {
        const cart = getCart();
        const productIndex = cart.findIndex(function (item) {
            return item.name.toLowerCase() === name.toLowerCase();
        });

        if (productIndex === -1) return;

        if (action === 'increase') {
            cart[productIndex].quantity += 1;
        }

        if (action === 'decrease') {
            cart[productIndex].quantity -= 1;
            if (cart[productIndex].quantity <= 0) {
                cart.splice(productIndex, 1);
            }
        }

        saveCart(cart);
        renderCart();
    }

    function openCart() {
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        if (panel) panel.classList.add('is-open');
        if (overlay) overlay.classList.add('is-visible');
    }

    function closeCart() {
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        if (panel) panel.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-visible');
    }

    function sendOrder() {
        const cart = getCart();

        if (!cart.length) {
            alert('Tu carrito está vacío. Añade productos antes de enviar el pedido.');
            return;
        }

        const customerName = prompt('Ingrese su nombre');
        if (customerName === null) {
            return;
        }

        const sanitizedName = customerName.trim();
        if (!sanitizedName) {
            alert('Debe ingresar un nombre para enviar el pedido.');
            return;
        }

        const itemsText = cart.map(function (item) {
            return '- ' + item.name + ' x' + item.quantity + ' - ' + formatCurrency(item.price * item.quantity);
        }).join('\n');

        const total = cart.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        const message = [
            'Hola Tonalli, quiero hacer este pedido:',
            '',
            'Cliente: ' + sanitizedName,
            itemsText,
            '',
            'Total: ' + formatCurrency(total),
            '',
            'Gracias.'
        ].join('\n');

        const encodedText = encodeURIComponent(message);
        const appUrl = 'whatsapp://send?phone=' + PHONE_NUMBER + '&text=' + encodedText;
        const webUrl = 'https://wa.me/' + PHONE_NUMBER + '?text=' + encodedText;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = appUrl;
            return;
        }

        window.location.href = webUrl;
    }

    function bindProductButtons() {
        document.querySelectorAll('.add-to-cart').forEach(function (button) {
            button.addEventListener('click', function () {
                const productItem = button.closest('.product-item');
                if (!productItem) return;

                const name = productItem.dataset.name || productItem.querySelector('.menu-text strong')?.textContent.trim();
                const price = Number(productItem.dataset.price || productItem.querySelector('.price')?.textContent.replace(/[$,]/g, '') || 0);

                if (!name || !price) return;

                addItemToCart(name, price);
            });
        });
    }

    function bindCartControls() {
        document.addEventListener('click', function (event) {
            const target = event.target;

            if (!(target instanceof HTMLElement)) {
                return;
            }

            if (target.matches('.qty-btn')) {
                const action = target.dataset.action;
                const name = decodeURIComponent(target.dataset.name || '');
                if (name) {
                    updateItemQuantity(name, action);
                }
            }
        });
    }

    function initCart() {
        const toggle = document.querySelector('.cart-toggle');
        const closeBtn = document.getElementById('cart-close');
        const overlay = document.getElementById('cart-overlay');
        const checkoutButtons = document.querySelectorAll('.checkout-btn');

        if (toggle) {
            toggle.addEventListener('click', openCart);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeCart);
        }

        if (overlay) {
            overlay.addEventListener('click', closeCart);
        }

        checkoutButtons.forEach(function (button) {
            button.addEventListener('click', sendOrder);
        });

        bindProductButtons();
        bindCartControls();
        renderCart();
    }

    document.addEventListener('DOMContentLoaded', initCart);
})();
