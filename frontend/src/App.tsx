
import { useEffect, useState } from 'react';
import './App.css';

type Product = {
  id: number;
  nombre: string;
  codigo: string | null;
  precio: number | string;
  stock: number;
  stock_minimo: number;
  categoria: string | null;
  activo: boolean;
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    precio: '',
    stock: '0',
    stock_minimo: '5',
  });

  async function loadProducts() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:3000/api/products');

      if (!response.ok) {
        throw new Error('No se pudieron cargar los productos');
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch {
      setError('No se pudo conectar con el backend. Comprueba que siga ejecutándose.');
    } finally {
      setLoading(false);
    }
  }

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          precio: Number(form.precio),
          stock: Number(form.stock),
          stock_minimo: Number(form.stock_minimo),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo guardar el producto');
      }

      setForm({
        nombre: '',
        codigo: '',
        precio: '',
        stock: '0',
        stock_minimo: '5',
      });

      setShowForm(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setSaving(false);
    }
  }

  async function updateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (editingId === null) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${editingId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            precio: Number(form.precio),
            stock: Number(form.stock),
            stock_minimo: Number(form.stock_minimo),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo actualizar el producto');
      }

      setEditingId(null);
      setShowForm(false);
      setForm({
        nombre: '',
        codigo: '',
        precio: '',
        stock: '0',
        stock_minimo: '5',
      });

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al actualizar'
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre,
      codigo: product.codigo ?? '',
      precio: String(product.precio),
      stock: String(product.stock),
      stock_minimo: String(product.stock_minimo),
    });
    setShowForm(true);
    setError('');
  }


  async function deactivateProduct(product: Product) {
    const confirmed = window.confirm(
      `¿Deseas desactivar el producto "${product.nombre}"?`
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(
        `http://localhost:3000/api/products/${product.id}/deactivate`,
        { method: 'PATCH' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo desactivar el producto');
      }

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado'
      );
    }
  }



  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        setError('');

        const response = await fetch('http://localhost:3000/api/products');

        if (!response.ok) {
          throw new Error('No se pudieron cargar los productos');
        }

        const data: Product[] = await response.json();

        if (!cancelled) {
          setProducts(data);
        }
      } catch {
        if (!cancelled) {
          setError(
            'No se pudo conectar con el backend. Comprueba que siga ejecutándose.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = products.filter((product) =>
    `${product.nombre} ${product.codigo ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const lowStock = products.filter(
    (product) => product.stock <= product.stock_minimo
  ).length;

  const totalValue = products.reduce(
    (sum, product) => sum + Number(product.precio) * product.stock,
    0
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>📦 StockFlow</h2>
        <p className="sidebar-label">MENÚ PRINCIPAL</p>
        <div className="nav-item active">▦ Inventario</div>
        <div className="nav-item">▤ Ventas</div>
        <div className="nav-item">▥ Reportes</div>
        <div className="sidebar-footer">Sistema de gestión</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Panel de control / Inventario</span>
          <span>Proyecto de portafolio</span>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">GESTIÓN DE NEGOCIO</p>
              <h1>Inventario</h1>
              <p className="subtitle">
                Controla tus productos y el estado de tus existencias.
              </p>
            </div>
            <div className="header-actions">
              <button
                className="secondary-button"
                onClick={() => void loadProducts()}
              >
                ↻ Actualizar
              </button>

              <button
                className="primary-button"
                onClick={() => setShowForm(!showForm)}
              >
                + Nuevo producto
              </button>
            </div>
          </div>


          {showForm && (
            <div
              className="modal-overlay"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <section
                className="modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-form-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <p className="eyebrow">GESTIÓN DE INVENTARIO</p>
                    <h2 id="product-form-title">
                      {editingId !== null ? 'Editar producto' : 'Nuevo producto'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="modal-close"
                    aria-label="Cerrar formulario"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={editingId !== null ? updateProduct : createProduct}
                  className="product-form"
                >
                  <label>
                    Nombre del producto *
                    <input
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Teclado mecánico"
                    />
                  </label>

                  <label>
                    Código
                    <input
                      value={form.codigo}
                      onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                      placeholder="Ej. TEC-002"
                    />
                  </label>

                  <label>
                    Precio (S/) *
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    />
                  </label>

                  <label>
                    Stock inicial *
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </label>

                  <label>
                    Stock mínimo
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock_minimo}
                      onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                    />
                  </label>

                  {error && <p className="error">{error}</p>}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                    >
                      Cancelar
                    </button>

                    <button type="submit" className="primary-button" disabled={saving}>
                      {saving
                        ? 'Guardando...'
                        : editingId !== null
                          ? 'Guardar cambios'
                          : 'Guardar producto'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}


          <section className="stats">
            <article className="stat-card">
              <span>Total de productos</span>
              <strong>{products.length}</strong>
              <small>Productos registrados</small>
            </article>
            <article className="stat-card">
              <span>Stock bajo</span>
              <strong>{lowStock}</strong>
              <small>Requieren revisión</small>
            </article>
            <article className="stat-card">
              <span>Valor del inventario</span>
              <strong>
                {totalValue.toLocaleString('es-PE', {
                  style: 'currency',
                  currency: 'PEN',
                })}
              </strong>
              <small>Precio × unidades disponibles</small>
            </article>
          </section>

          <section className="products-panel">
            <div className="panel-heading">
              <div>
                <h2>Productos</h2>
                <p>Consulta los artículos registrados en la base de datos.</p>
              </div>
              <input
                aria-label="Buscar productos"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {loading && <p className="message">Cargando productos...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.nombre}</strong>
                          <small>{product.categoria ?? 'Sin categoría'}</small>
                        </td>
                        <td>{product.codigo ?? '—'}</td>
                        <td>
                          {Number(product.precio).toLocaleString('es-PE', {
                            style: 'currency',
                            currency: 'PEN',
                          })}
                        </td>
                        <td>{product.stock}</td>
                        <td>
                          <span
                            className={
                              product.stock <= product.stock_minimo
                                ? 'badge warning'
                                : 'badge success'
                            }
                          >
                            {product.stock <= product.stock_minimo
                              ? 'Stock bajo'
                              : 'Disponible'}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditing(product)}
                          >
                            Editar
                          </button>
                        </td>

                        <button
                          type="button"
                          className="cancel-button"
                          onClick={() => void deactivateProduct(product)}
                        >
                          Desactivar
                        </button>

                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <p className="message">
                    {products.length === 0
                      ? 'Todavía no hay productos registrados.'
                      : 'No se encontraron productos.'}
                  </p>
                )}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
