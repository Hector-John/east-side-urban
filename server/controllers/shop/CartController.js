const Cart = require("../../models/Cart");
const Product = require("../../models/Products");
const mongoose = require('mongoose');

// Validate stock
const validateStock = async (productId, quantity) => {
  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");
    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} item(s) available`);
    }
    return product; 
  } catch (error) {
    console.error("Stock validation error:", error);
    throw error;
  }
};


const getCart = async (userId, sessionId) => {
  try {
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      return await Cart.findOne({ userId }).populate('items.productId');
    }
    
    if (sessionId) {
      return await Cart.findOne({ sessionId }).populate('items.productId');
    }
    
    return null;
  } catch (error) { 
    console.error("Cart lookup error:", error);
    throw error;
  }
};


// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;

    console.log("=== addToCart called ===");
    console.log("Request body:", { productId, quantity });
    console.log("User ID:", userId);

    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID and quantity (≥1) are required"
      });
    }

    // Validate stock
    const product = await validateStock(productId, quantity);
    console.log("Product validation success:", product);

    // Find cart by userId
    let cart = await Cart.findOne({ userId });
    console.log("Fetched cart:", cart);

    if (!cart) {
      console.log("No cart found, creating new cart...");
      cart = await Cart.create({
        userId,
        items: [{
          productId,
          quantity,
          title: product.title,
          price: product.price,
          salePrice: product.salePrice,
          image: product.image || "",
          totalStock: product.totalStock
        }]
      });
      console.log("New cart created:", cart);
    } else {
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      console.log("Existing cart item:", existingItem);

      if (existingItem) {
        console.log("Updating quantity...");
        existingItem.quantity += quantity;
        // Validate updated quantity
        await validateStock(productId, existingItem.quantity);
      } else {
        console.log("Adding new item to cart...");
        cart.items.push({
          productId,
          quantity,
          title: product.title,
          price: product.price,
          salePrice: product.salePrice,
          image: product.image || "",
          totalStock: product.totalStock
        });
      }

      await cart.save();
      console.log("Cart saved successfully.");
    }

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate("items.productId", "name price salePrice images stock");

    console.log("Updated cart populated:", updatedCart);

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart: {
        items: updatedCart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          title: item.productId.name,
          price: item.productId.price,
          salePrice: item.productId.salePrice,
          image: item.productId.images?.[0] || "",
          stock: item.productId.stock
        }))
      }
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};







// fetchCartItems
const fetchCartItems = async (req, res) => {
  console.log("\n========== FETCH CART ITEMS ==========");
  console.log("-> req.user:", req.user);
  console.log("-> req.cookies:", req.cookies);
  console.log("-> req.sessionID:", req.sessionID);

  try {
    const userId = req.user?.id;
    const sessionId = req.cookies?.guestSessionId || req.sessionID;

    console.log(`--> Deciding fetch logic:`);
    console.log("   userId:", userId);
    console.log("   sessionId:", sessionId);

    let cart;
    if (userId) {
      console.log("-> Searching by userId...");
      cart = await Cart.findOne({ userId })
        .populate("items.productId", "name price salePrice images stock");
    } else if (sessionId) {
      console.log("-> Searching by sessionId...");
      cart = await Cart.findOne({ sessionId })
        .populate("items.productId", "name price salePrice images stock");
    } else {
      console.log("-> No userId or sessionId, returning empty.");
      return res.status(200).json({
        success: true,
        cart: { items: [] }
      });
    }

    if (!cart) {
      console.log("-> No cart found, returning empty.");
      return res.status(200).json({
        success: true,
        cart: { items: [] }
      });
    }

    console.log(`-> Cart found with ${cart.items.length} items.`);

    res.status(200).json({
      success: true,
      cart: {
        items: cart.items.map(item => ({
          productId: item.productId?._id,
          quantity: item.quantity,
          title: item.productId?.name,
          price: item.productId?.price,
          salePrice: item.productId?.salePrice,
          image: item.productId?.images?.[0] || "",
          stock: item.productId?.stock,
        }))
      }
    });
  } catch (error) {
    console.error("Fetch cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart"
    });
  }
};


// updateCartItemsQty
const updateCartItemsQty = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;
    const sessionId = req.cookies?.guestSessionId || req.sessionID;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID and quantity (≥1) are required"
      });
    }

    await validateStock(productId, quantity);
    const cart = await getCart(userId, sessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(item => 
      (item.productId._id || item.productId).toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      productId,
      quantity
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// deleteCartItem
const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.cookies?.guestSessionId || req.sessionID;

    const cart = await getCart(userId, sessionId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      item => (item.productId._id || item.productId).toString() !== productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    await cart.save();
    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      productId
    });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete item"
    });
  }
};


// Robust mergeGuestCart
const mergeGuestCart = async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.cookies?.guestSessionId;

  console.log(`[CartController] Merging carts - userId: ${userId}, sessionId: ${sessionId}`);

  try {
    if (!sessionId) {
      console.log("[CartController] No guest session ID found");
      return res.status(200).json({ success: true });
    }

    const guestCart = await Cart.findOne({ sessionId });
    console.log("[CartController] Guest cart to merge:", guestCart);

    if (!guestCart || guestCart.items.length === 0) {
      console.log("[CartController] No guest cart items to merge");
      return res.status(200).json({ success: true });
    }

    let userCart = await Cart.findOne({ userId });
    console.log("[CartController] Existing user cart:", userCart);

    if (!userCart) {
      console.log("[CartController] Creating new user cart");
      userCart = await Cart.create({
        userId,
        items: guestCart.items
      });
    } else {
      console.log("[CartController] Merging into existing user cart");
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find(item =>
          item.productId.equals(guestItem.productId)
        );
        
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          userCart.items.push(guestItem);
        }
      }
      await userCart.save();
    }

    await Cart.deleteOne({ sessionId });
    console.log("[CartController] Guest cart deleted after merge");

    const mergedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price salePrice images stock");

    console.log("[CartController] Merged cart result:", mergedCart);

    res.status(200).json({
      success: true,
      cart: {
        items: mergedCart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          title: item.productId.name,
          price: item.productId.price,
          image: item.productId.images?.[0] || ""
        }))
      }
    });
  } catch (error) {
    console.error("[CartController] Merge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to merge carts"
    });
  } 
};

module.exports = {
  addToCart,
  fetchCartItems,
  updateCartItemsQty,
  deleteCartItem,
  mergeGuestCart
};