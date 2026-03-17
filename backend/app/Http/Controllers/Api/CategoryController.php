<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            Category::where('user_id', Auth::id())->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:100',
            'type'  => 'required|in:income,expense',
            'icon'  => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $category = Category::create([
            'user_id' => Auth::id(),
            'name'    => $request->name,
            'type'    => $request->type,
            'icon'    => $request->icon,
            'color'   => $request->color ?? '#6366f1',
        ]);

        return response()->json($category, 201);
    }

    public function show(string $id)
    {
        $category = Category::where('user_id', Auth::id())->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name'  => 'sometimes|string|max:100',
            'type'  => 'sometimes|in:income,expense',
            'icon'  => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $category = Category::where('user_id', Auth::id())->findOrFail($id);
        $category->update($request->only('name', 'type', 'icon', 'color'));
        return response()->json($category);
    }

    public function destroy(string $id)
    {
        $category = Category::where('user_id', Auth::id())->findOrFail($id);
        $category->delete();
        return response()->json(['message' => 'Kategori dihapus.']);
    }
}