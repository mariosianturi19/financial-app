<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Seed test user (opsional, untuk development)
        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name'     => 'Test User',
                'password' => Hash::make('password123'),
            ]
        );

        // Seed default categories untuk test user
        DefaultCategoriesSeeder::seedForUser($testUser);

        // Jika ada user lain yang belum punya kategori default, seed juga
        $this->call(DefaultCategoriesSeeder::class);
    }
}