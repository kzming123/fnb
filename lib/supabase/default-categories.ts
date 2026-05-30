// Default expense categories seeded for every new business.
// Matches the schema check constraint in expense_categories.type.
// Called from: RegisterForm (browser) and /auth/callback (server).

export const DEFAULT_EXPENSE_CATEGORIES = [
  // Food cost
  { name: 'Meat',                type: 'meat'                },
  { name: 'Seafood',             type: 'seafood'             },
  { name: 'Vegetables',          type: 'vegetables'          },
  { name: 'Dry Goods',           type: 'dry_goods'           },
  { name: 'Beverages',           type: 'beverages'           },
  { name: 'Packaging',           type: 'packaging'           },
  { name: 'Sauce & Seasoning',   type: 'sauce_seasoning'     },
  // Operating
  { name: 'Rent',                type: 'rent'                },
  { name: 'Salaries',            type: 'salaries'            },
  { name: 'Utilities',           type: 'utilities'           },
  { name: 'Marketing',           type: 'marketing'           },
  { name: 'Repairs',             type: 'repairs'             },
  { name: 'Cleaning',            type: 'cleaning'            },
  { name: 'POS / Software',      type: 'pos_software'        },
  { name: 'Delivery Commission', type: 'delivery_commission' },
  { name: 'Others',              type: 'others'              },
] as const
