
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit, Trash2, Upload, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  photo_url?: string;
  is_available: boolean;
  preparation_time: number;
  ingredients?: string[];
  allergens?: string[];
  created_at: string;
}

export const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    is_available: true,
    preparation_time: 15,
    ingredients: '',
    allergens: ''
  });

  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu-items', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurant?.id
  });

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Please select a JPEG, PNG, WebP, or GIF image", variant: "destructive" });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!restaurant?.id) return null;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurant.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Upload failed", description: "Failed to upload image", variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Create menu item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      if (!restaurant?.id) throw new Error('No restaurant selected');

      let photoUrl = null;
      if (selectedFile) {
        photoUrl = await uploadImage(selectedFile);
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurant.id,
          name: itemData.name,
          description: itemData.description || null,
          price: itemData.price,
          category: itemData.category,
          image_url: itemData.image_url || null,
          photo_url: photoUrl,
          is_available: itemData.is_available,
          preparation_time: itemData.preparation_time,
          ingredients: itemData.ingredients ? itemData.ingredients.split(',').map((i: string) => i.trim()) : null,
          allergens: itemData.allergens ? itemData.allergens.split(',').map((a: string) => a.trim()) : null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] });
      toast({ title: "Menu item created successfully" });
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating menu item:', error);
      toast({ title: "Error creating menu item", variant: "destructive" });
    }
  });

  // Update menu item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...itemData }: any) => {
      let photoUrl = editingItem?.photo_url;
      
      if (selectedFile) {
        photoUrl = await uploadImage(selectedFile);
      }

      const { data, error } = await supabase
        .from('menu_items')
        .update({
          name: itemData.name,
          description: itemData.description || null,
          price: itemData.price,
          category: itemData.category,
          image_url: itemData.image_url || null,
          photo_url: photoUrl,
          is_available: itemData.is_available,
          preparation_time: itemData.preparation_time,
          ingredients: itemData.ingredients ? itemData.ingredients.split(',').map((i: string) => i.trim()) : null,
          allergens: itemData.allergens ? itemData.allergens.split(',').map((a: string) => a.trim()) : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] });
      toast({ title: "Menu item updated successfully" });
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating menu item:', error);
      toast({ title: "Error updating menu item", variant: "destructive" });
    }
  });

  // Delete menu item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] });
      toast({ title: "Menu item deleted successfully" });
    },
    onError: (error) => {
      console.error('Error deleting menu item:', error);
      toast({ title: "Error deleting menu item", variant: "destructive" });
    }
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !is_available })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] });
      toast({ title: "Menu item availability updated" });
    },
    onError: (error) => {
      console.error('Error updating availability:', error);
      toast({ title: "Error updating availability", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      image_url: '',
      is_available: true,
      preparation_time: 15,
      ingredients: '',
      allergens: ''
    });
    setSelectedFile(null);
    setFilePreview(null);
    setShowCreateForm(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      updateItemMutation.mutate({ ...editingItem, ...formData });
    } else {
      createItemMutation.mutate(formData);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image_url: item.image_url || '',
      is_available: item.is_available,
      preparation_time: item.preparation_time,
      ingredients: item.ingredients?.join(', ') || '',
      allergens: item.allergens?.join(', ') || ''
    });
    if (item.photo_url) {
      setFilePreview(item.photo_url);
    }
    setShowCreateForm(true);
  };

  const clearImage = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading menu items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</CardTitle>
            <CardDescription>
              {editingItem ? 'Update menu item information' : 'Add a new item to your menu'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Photo Upload Section */}
              <div>
                <Label htmlFor="photo">Menu Item Photo</Label>
                <div className="mt-2 space-y-4">
                  {filePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo')?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                    <span className="text-sm text-gray-500">Max 5MB • JPEG, PNG, WebP, GIF</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preparation_time">Prep Time (minutes)</Label>
                  <Input
                    id="preparation_time"
                    type="number"
                    min="1"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({...formData, preparation_time: parseInt(e.target.value) || 15})}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                  />
                  <Label htmlFor="is_available">Available</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">Additional Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
                  <Input
                    id="ingredients"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    placeholder="Tomato, Cheese, Basil"
                  />
                </div>
                <div>
                  <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                  <Input
                    id="allergens"
                    value={formData.allergens}
                    onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                    placeholder="Dairy, Gluten"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createItemMutation.isPending || updateItemMutation.isPending || isUploading}
                >
                  {createItemMutation.isPending || updateItemMutation.isPending || isUploading
                    ? 'Saving...' 
                    : editingItem ? 'Update Item' : 'Add Item'
                  }
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items ({filteredItems.length})</CardTitle>
          <CardDescription>Manage your restaurant menu</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Prep Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {(item.photo_url || item.image_url) && (
                        <img 
                          src={item.photo_url || item.image_url} 
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">${item.price}</TableCell>
                  <TableCell>{item.preparation_time} min</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={() => toggleAvailabilityMutation.mutate({ 
                          id: item.id, 
                          is_available: item.is_available 
                        })}
                      />
                      <span className={`text-sm ${item.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && (
            <p className="text-center text-gray-500 py-8">No menu items found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
