import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { FaShoppingCart, FaUser } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { MdLogout } from "react-icons/md";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSelector, useDispatch } from "react-redux";
import { shopHeaderMenuItems } from "@/config/config";
import { logoutUser, resetTokenAndCridentials } from "@/store/auth/auth";
import { fetchCartItems } from "@/store/shop/cartSlice";
import CartWrapper from "./cartWrapper";
import { Label } from "../ui/label";
import images from "@/assets/assets";

// Handle Navigation
function handleNavigation(menuItem, navigate) {
  const currentFilter =
    menuItem.id !== "home" &&
    menuItem.id !== "products" &&
    menuItem.id !== "search"
      ? { category: [menuItem.id] }
      : null;

  if (currentFilter) {
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    const query = new URLSearchParams();
    query.set("category", menuItem.id);
    navigate(`/listing?${query.toString()}`);
  } else {
    sessionStorage.removeItem("filters");
    navigate(menuItem.path);
  }
}

// MenuItems component
function MenuItems({ closeSheet, navigate }) {
  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center lg:flex-row gap-6">
      {shopHeaderMenuItems.map((menuItem) => (
        <Label
          key={menuItem._id}
          className="text-sm font-medium cursor-pointer"
          onClick={() => {
            handleNavigation(menuItem, navigate);
            closeSheet && closeSheet();
          }}
        >
          {menuItem.id === "search" ? (
            // Search logic stays here as you requested
            <CiSearch className="h-3 w-3" />
          ) : (
            menuItem.label
          )}
        </Label>
      ))}
    </nav>
  );
}

// RightContent component
function RightContent() {
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const [openCartSheet, setOpenCartSheet] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (user?.id) {
      dispatch(fetchCartItems(user?.id));
    }
  }, [dispatch, user?.id]);

  const totalItems =
    cartItems?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  function handleLogout() {
    dispatch(resetTokenAndCridentials());
    sessionStorage.clear();
    navigate("/auth/login");
  }

  return (
    <div className="flex lg:items-center lg:flex-row flex-col gap-4">
      {/* Search Button */}
      <Button
        onClick={() => navigate("/search")}
        variant="outline"
        size="icon"
        aria-label="Search"
        className="relative"
      >
        <CiSearch className="h-6 w-6" />
      </Button>

      {/* Cart Button */}
      <Sheet
        open={openCartSheet}
        onOpenChange={(state) => setOpenCartSheet(state)}
      >
        <Button
          onClick={() => setOpenCartSheet(true)}
          variant="outline"
          size="icon"
          aria-label="View Cart"
          className="relative"
        >
          <FaShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
        <SheetContent className="w-full max-w-sm">
          <CartWrapper
            setOpenCartSheet={setOpenCartSheet}
            cartItems={cartItems?.items?.length > 0 ? cartItems.items : []}
          />
        </SheetContent>
      </Sheet>

      {/* User Avatar and Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="bg-black cursor-pointer">
            <AvatarFallback className="bg-black text-white font-extrabold">
              {user?.userName ? user.userName[0].toUpperCase() : "G"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-56">
          <DropdownMenuLabel>
            Logged in as {user?.userName || "Guest"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/account")}>
            <FaUser className="mr-2 h-4 w-4" /> Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <MdLogout className="mr-2 h-4 w-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


// ShopHeader component
const ShopHeader = () => {
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/home" className="flex items-center gap-2">
          <img src={images.logo} className="max-h-[4rem]" />
        </Link>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <IoMdMenu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full max-w-xs" side="left">
            <MenuItems
              closeSheet={() => setIsSheetOpen(false)}
              navigate={navigate}
            />
            <RightContent />
          </SheetContent>
        </Sheet>
        <div className="hidden lg:block">
          <MenuItems navigate={navigate} />
        </div>
        <div className="hidden lg:block">
          <RightContent />
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
