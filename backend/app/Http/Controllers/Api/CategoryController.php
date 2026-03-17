<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:100',
            'type'  => 'required|in:income,expense',
            'icon'  => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $category = Category::create($request->only('name', 'type', 'icon', 'color'));
        return response()->json($category, 201);
    }

    public function show(string $id)
    {
        return response()->json(Category::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name'  => 'sometimes|string|max:100',
            'type'  => 'sometimes|in:income,expense',
            'icon'  => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $category = Category::findOrFail($id);
        $category->update($request->only('name', 'type', 'icon', 'color'));
        return response()->json($category);
    }

    public function destroy(string $id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['message' => 'Kategori dihapus.']);
    }
}
