<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultCategoriesSeeder extends Seeder
{
    /**
     * Definisi kategori default sistem.
     * Digunakan saat register user baru dan bisa dipanggil manual via DatabaseSeeder.
     */
    public static array $INCOME = [
        ['name' => 'Gaji',                  'icon' => '💼', 'color' => '#34d399'],
        ['name' => 'Bonus',                  'icon' => '🎁', 'color' => '#a78bfa'],
        ['name' => 'Dikasih Orang Tua',      'icon' => '🏠', 'color' => '#60a5fa'],
        ['name' => 'Freelance / Sampingan',  'icon' => '💻', 'color' => '#fb923c'],
        ['name' => 'Penjualan',              'icon' => '🛍️', 'color' => '#f472b6'],
        ['name' => 'Lainnya',               'icon' => '✨', 'color' => '#94a3b8'],
    ];

    public static array $EXPENSE = [
        ['name' => 'Makanan',                         'icon' => '🍔', 'color' => '#fb7185'],
        ['name' => 'Transportasi',                    'icon' => '🚗', 'color' => '#60a5fa'],
        ['name' => 'Tagihan',                         'icon' => '⚡', 'color' => '#fbbf24'],
        ['name' => 'Tempat Tinggal',                  'icon' => '🏠', 'color' => '#34d399'],
        ['name' => 'Kesehatan',                       'icon' => '💊', 'color' => '#f472b6'],
        ['name' => 'Pendidikan',                      'icon' => '📚', 'color' => '#a78bfa'],
        ['name' => 'Nongkrong / Jajan',               'icon' => '☕', 'color' => '#fb923c'],
        ['name' => 'Shopping',                        'icon' => '👔', 'color' => '#e879f9'],
        ['name' => 'Hiburan',                         'icon' => '🎬', 'color' => '#2dd4bf'],
        ['name' => 'Spotify',                         'icon' => '🎵', 'color' => '#4ade80'],
    ];

    /**
     * Seed kategori default untuk user tertentu.
     * Idempotent — tidak akan duplikasi jika sudah ada.
     */
    public static function seedForUser(User $user): void
    {
        $existing = Category::where('user_id', $user->id)
            ->where('is_default', true)
            ->pluck('name')
            ->toArray();

        $toInsert = [];
        $now      = now();

        foreach (self::$INCOME as $cat) {
            if (in_array($cat['name'], $existing)) continue;
            $toInsert[] = [
                'user_id'    => $user->id,
                'name'       => $cat['name'],
                'type'       => 'income',
                'icon'       => $cat['icon'],
                'color'      => $cat['color'],
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (self::$EXPENSE as $cat) {
            if (in_array($cat['name'], $existing)) continue;
            $toInsert[] = [
                'user_id'    => $user->id,
                'name'       => $cat['name'],
                'type'       => 'expense',
                'icon'       => $cat['icon'],
                'color'      => $cat['color'],
                'is_default' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($toInsert)) {
            Category::insert($toInsert);
        }
    }

    /**
     * Dipakai saat `php artisan db:seed` manual
     * — seed untuk semua user yang belum punya kategori default.
     */
    public function run(): void
    {
        $users = User::all();
        foreach ($users as $user) {
            static::seedForUser($user);
        }
    }
}