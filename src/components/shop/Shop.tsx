import React from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store/index.js";
import { purchaseItem, setPet } from "../../store/userSlice.js";
import { ShoppingCart, Check, Diamond, Star } from "lucide-react";
import { motion } from "framer-motion";

const shopItems = [
  {
    id: "pet1",
    name: "Mèo Máy Mắn",
    description: "Một chú mèo dễ thương cổ vũ bạn học tập.",
    price: 50,
    icon: "🐱",
    type: "pet",
  },
  {
    id: "pet2",
    name: "Chó Thông Thái",
    description: "Người bạn trung thành giúp bạn tập trung.",
    price: 50,
    icon: "🐶",
    type: "pet",
  },
  {
    id: "theme1",
    name: "Chủ Đề Pastel",
    description: "Giao diện màu sắc nhẹ nhàng, dịu mắt.",
    price: 100,
    icon: "🎨",
    type: "theme",
  },
  {
    id: "title1",
    name: 'Danh Hiệu "Thần Học"',
    description: "Hiển thị danh hiệu đặc biệt trên hồ sơ.",
    price: 200,
    icon: "👑",
    type: "title",
  },
];

const Shop: React.FC = () => {
  const { diamonds, ownedItems, petId } = useSelector(
    (state: RootState) => state.user,
  );
  const dispatch = useDispatch();

  const handleAction = (item: any) => {
    if (ownedItems.includes(item.id)) {
      if (item.type === "pet") {
        dispatch(setPet(item.id));
      }
    } else {
      if (diamonds >= item.price) {
        dispatch(purchaseItem(item));
      } else {
        alert("Bạn không đủ kim cương!");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {shopItems.map((item) => {
        const isOwned = ownedItems.includes(item.id);
        const isEquipped = petId === item.id;
        const canAfford = diamonds >= item.price;

        return (
          <motion.div
            key={item.id}
            whileHover={{ y: -5 }}
            className="pastel-card flex flex-col items-center text-center relative overflow-hidden"
          >
            {isOwned && (
              <div className="absolute top-3 right-3 text-green-500">
                <Check size={20} strokeWidth={3} />
              </div>
            )}

            <div className="text-6xl mb-4 bg-gray-50 w-24 h-24 flex items-center justify-center rounded-3xl">
              {item.icon}
            </div>

            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {item.name}
            </h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">
              {item.description}
            </p>

            <div className="w-full pt-4 border-t border-gray-50 flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                <Diamond size={18} fill="currentColor" />
                <span>{item.price}</span>
              </div>

              <button
                onClick={() => handleAction(item)}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isEquipped
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : isOwned
                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                      : canAfford
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 grayscale cursor-not-allowed"
                }`}
              >
                {isEquipped ? (
                  "Đang dùng"
                ) : isOwned ? (
                  item.type === "pet" ? (
                    "Sử dụng"
                  ) : (
                    "Đã sở hữu"
                  )
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Mua ngay
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Shop;
