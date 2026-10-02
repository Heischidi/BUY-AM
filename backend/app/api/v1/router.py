from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.products import router as products_router
from app.api.v1.endpoints.categories import router as categories_router
from app.api.v1.endpoints.cart import cart_router, wishlist_router
from app.api.v1.endpoints.orders import router as orders_router, payment_router
from app.api.v1.endpoints.sellers import seller_router, address_router
from app.api.v1.endpoints.procurement import router as procurement_router
from app.api.v1.endpoints.ai import router as ai_router
from app.api.v1.endpoints.admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(categories_router)
api_router.include_router(cart_router)
api_router.include_router(wishlist_router)
api_router.include_router(orders_router)
api_router.include_router(payment_router)
api_router.include_router(seller_router)
api_router.include_router(address_router)
api_router.include_router(procurement_router)
api_router.include_router(ai_router)
api_router.include_router(admin_router)
