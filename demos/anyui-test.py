# /// script
# dependencies = [
#     "anywidget==0.9.21",
#     "marimo",
#     "traitlets==5.14.3",
# ]
# requires-python = ">=3.11"
# ///

import marimo

__generated_with = "0.19.11"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import sys
    from pathlib import Path
    import anywidget

    # Get the directory two levels above the current notebook
    parent_parent_dir = str(Path().resolve() / "anyui")

    # Add it to the search path
    if parent_parent_dir not in sys.path:
        sys.path.insert(0, parent_parent_dir)

    from anyui import CounterButton,Box,Slider

    cb = CounterButton(value=60)
    s = Slider(value=30)
    #b= Box(children=[cb,s])
    b= Box(children=[])
    mo.ui.anywidget(b).text  
    return anywidget, b, mo


@app.cell
def _(b, mo):
    mo.ui.anywidget(b).text
    return


@app.cell
def _(anywidget):
    anywidget.AnyWidget
    return


@app.cell
def _():
    capstan_parameters=dict(n_spokes=13, n_strands=5,
                    phi_rim=0.160, r_fillet_rim=0.060, phi_hub=0.10, r_fillet_hub=0.160,
                    ew_rim=1.0,ew_fillet_rim=0.8,ew_spokes=0.7,ew_fillet_hub=0.5,ew_hub=0.5,
                    spoke_midpoint=0.38,mesh_twist_pitch = -60,
                    l_turn= 60.0, l_tot= 420.0, d_cable=0.9, groove_pitch=1.25, left_handed=False, n_cable_tunnels=2,
                    tunnel_pos=0.5,
                    hub_squeezeout_factor=2.,shaft_type='D', d_shaft=5.0,D_key=0.5, shaft_tolerance=0.15, countersink_chamfer=0.75,
                    z_=3.2,
                    n_skirt=3,skirt_offset=1.0,hl=0.2,hl_start=0.05,
                    #print_parameters
                    design_name = 'Capstan',
                    nozzle_temp = 220.0, bed_temp = 120.0,
                    nominal_print_speed = 10.0*60.0,#10*60 #print slow to give the layer time to cool
                    max_print_speed = 15*60,#=speed for ew=0.5mm 
                    nominal_ew = 0.75,   # extrusion width
                    fan_percent = 100.0,
                    fan_z_start = 1.0,
                    #  nominal_eh = 0.2,    # extrusion/layer heigth
                    printer_name='generic', # generic / ultimaker2plus / prusa_i3 / ender_3 / cr_10 / bambulab_x1 / toolchanger_T0
                    )

    capstan_parameter_descriptions={'l_turn':'circumference',
                                    'l_tot': 'cable groove length',
                                    'd_shaft':'shaft diameter',
                                    'n_cable_tunnels':'cable tunnels',
                                    'hl':'layer height',
                                    'nominal_print_speed':'print speed',
                                    'nominal_ew':'extrusion width'}

    return capstan_parameter_descriptions, capstan_parameters


@app.cell
def _(mo):
    def capstan(*args,**kwargs):
        ...
    def update_capstan_plot(**env):
        ...
    def save_capstan_gcode(*args,**kwargs):
        ...
    def update_capstan_preview(*args,**kwargs):
       ...
    output12=mo.md("output 12 placeholder")
    return output12, save_capstan_gcode, update_capstan_preview


@app.cell
def _(
    capstan_parameter_descriptions,
    capstan_parameters,
    mo,
    output12,
    save_capstan_gcode,
    update_capstan_preview,
):

    # Assume these are already defined in prior cells:
    # capstan_parameters (dict)
    # capstan_parameter_descriptions (dict)
    # capstan(...) function
    # update_capstan_plot(**env)
    # save_capstan_gcode(...)
    # update_capstan_preview(...)
    # capstan_status_widget can be replaced with mo.md or a simple text output

    # Create widgets (one cell or split logically)
    widget_width=""
    n_spokes = mo.ui.number(step=1,value=capstan_parameters["n_spokes"], label="n_spokes").style(width=widget_width)
    n_strands = mo.ui.number(step=1, value=capstan_parameters["n_strands"], label="n_strands").style(width=widget_width)

    phi_rim = mo.ui.number(value=capstan_parameters["phi_rim"], label=capstan_parameter_descriptions.get("phi_rim", "phi_rim"), step=0.001).style(width=widget_width)
    # ... repeat for other numeric params with mo.ui.number or mo.ui.slider as appropriate

    l_turn = mo.ui.number(value=capstan_parameters["l_turn"], label=capstan_parameter_descriptions.get("l_turn", "l_turn"), step=0.1).style(width=widget_width)
    l_tot = mo.ui.number(value=capstan_parameters["l_tot"], label=capstan_parameter_descriptions.get("l_tot", "l_tot"), step=0.1).style(width=widget_width)
    d_shaft = mo.ui.number(value=capstan_parameters["d_shaft"], label=capstan_parameter_descriptions.get("d_shaft", "d_shaft"), step=0.01).style(width=widget_width)
    groove_pitch = mo.ui.number(value=capstan_parameters["groove_pitch"], label="groove_pitch", step=0.01).style(width=widget_width)

    left_handed = mo.ui.switch(value=capstan_parameters["left_handed"], label="left_handed").style(width=widget_width)
    shaft_type = mo.ui.dropdown(options=["O", "D", "DD"], value=capstan_parameters["shaft_type"], label="shaft_type").style(width=widget_width)
    n_cable_tunnels = mo.ui.dropdown(options=[1, 2], value=capstan_parameters["n_cable_tunnels"], label=capstan_parameter_descriptions.get("n_cable_tunnels", "n_cable_tunnels")).style(width=widget_width)

    # Vertical z_ slider (marimo supports orientation="vertical")
    z_ = mo.ui.slider(
        start=0.0,  # will be updated dynamically in a later cell
        stop=10.0,  # placeholder; update via reactive cell
        value=capstan_parameters["z_"],
        step=0.2,
        orientation="vertical",
        label="z_",
        show_value=True
    )

    # Print parameters
    hl = mo.ui.number(value=capstan_parameters["hl"], label=capstan_parameter_descriptions.get("hl", "hl"), step=0.01)
    nominal_ew = mo.ui.number(value=capstan_parameters["nominal_ew"], label=capstan_parameter_descriptions.get("nominal_ew", "nominal_ew"), step=0.01)
    nominal_print_speed = mo.ui.number(value=capstan_parameters["nominal_print_speed"], label=capstan_parameter_descriptions.get("nominal_print_speed", "nominal_print_speed"), step=1)
    nozzle_temp = mo.ui.number(value=capstan_parameters["nozzle_temp"], label="nozzle_temp", step=1)
    bed_temp = mo.ui.number(value=capstan_parameters["bed_temp"], label="bed_temp", step=1)
    fan_percent = mo.ui.slider(start=0, stop=100, value=capstan_parameters["fan_percent"], label="fan_percent")
    fan_z_start = mo.ui.number(value=capstan_parameters["fan_z_start"], label="fan_z_start", step=0.1)
    printer_name = mo.ui.text(value=capstan_parameters["printer_name"], label="printer_name")
    design_name = mo.ui.text(value=capstan_parameters["design_name"], label="design_name")

    # Buttons
    save_button = mo.ui.button(label="download G-Code", on_click=save_capstan_gcode, kind="neutral")
    update_preview_button = mo.ui.button(label="update preview", on_click=update_capstan_preview)

    # Status (simple reactive text)
    status = mo.md("Status: ready")  # update this reactively in a cell below

    # Mesh section (VBox equivalent)
    mesh_section = mo.vstack([
        mo.md("## Mesh"),
        mo.hstack([n_spokes, n_strands]),
        mo.hstack([l_turn, d_shaft]),
        mo.hstack([phi_rim, mo.ui.number(value=capstan_parameters.get("ew_rim", 1.0), label="ew_rim")]),
        mo.hstack([mo.ui.number(value=capstan_parameters.get("r_fillet_rim", 0.06), label="r_fillet_rim"),
                   mo.ui.number(value=capstan_parameters.get("ew_fillet_rim", 0.8), label="ew_fillet_rim")]),
        # add remaining mesh rows similarly...
        mo.md("output10 placeholder")  # replace with your plot/output
    ])

    # Capstan Geometry section
    geometry_section = mo.vstack([
        mo.md("## Capstan Geometry"),
        l_tot, l_turn, groove_pitch, d_shaft,
        mo.ui.number(value=capstan_parameters.get("shaft_tolerance", 0.15), label="shaft_tolerance"),
        shaft_type,
        mo.ui.number(value=capstan_parameters.get("D_key", 0.5), label="D_key"),
        mo.ui.number(value=capstan_parameters.get("mesh_twist_pitch", -60), label="mesh_twist_pitch"),
        n_cable_tunnels,
        mo.ui.number(value=capstan_parameters.get("tunnel_pos", 0.5), label="tunnel_pos"),
        mo.ui.number(value=capstan_parameters.get("countersink_chamfer", 0.75), label="countersink_chamfer"),
        left_handed,
        mo.ui.number(value=capstan_parameters.get("n_skirt", 3), label="n_skirt"),
        mo.ui.number(value=capstan_parameters.get("skirt_offset", 1.0), label="skirt_offset"),
        mo.hstack([mo.md("output 11 placeholder"), z_])  # your vertical slider here
    ])

    # Output section (G-Code / preview)
    output_section = mo.vstack([mo.md("## Output"), output12])  # your output12 placeholder

    # Print Parameters tab content
    print_section = mo.vstack([
        mo.md("## Print Parameters"),
        mo.hstack([hl, update_preview_button, status]),
        mo.hstack([nominal_ew]),
        mo.hstack([nominal_print_speed]),
        mo.hstack([nozzle_temp, bed_temp]),
        mo.hstack([fan_percent, fan_z_start]),
        printer_name,
        design_name,
        mo.hstack([save_button, status])
    ])

    # Main tabs (equivalent to widgets.Tab)
    ui_tabs = mo.tabs({
        "Design": mo.vstack([
            mesh_section,
            geometry_section,
            output_section
        ], justify="start"),
        "Preview": print_section,   # adjust as needed; your second "Print Parameters" seems duplicate
        "G-Code": mo.vstack([mo.md("## G-Code"), save_button, status])  # or your full G-Code output
    })

    # Display the entire UI (put this in the last cell of the group)
    ui_tabs
    return d_shaft, hl, l_tot, n_spokes, n_strands, nominal_ew


@app.cell
def _(d_shaft, hl, l_tot, mo, n_spokes, n_strands, nominal_ew):
    ()
    mo.md(f"""
    | | |
    |--------------------|----------------|
    | {n_spokes}|{n_strands}|
    |{l_tot} | {hl} mm  |
    | {d_shaft}   | {nominal_ew} mm |
    """)
    return


@app.cell
def _(mo):
    sl= mo.ui.slider(1, 10)
    te = mo.ui.text()
    da = mo.ui.date()
    d =     {
            "slider": sl,
            "text": te,
            "date": da,
        }
    d1= mo.ui.dictionary(d)
    d2= mo.ui.dictionary(d)
    mo.hstack([d1,d2])
    return d, d1, da, sl, te


@app.cell
def _(da, sl, te):
    sl,te,da
    return


@app.cell
def _(d1):
    d1.value
    return


@app.cell
def _(d, d1, mo):
    mo.hstack([mo.ui.dictionary(d),mo.ui.dictionary(d1)])
    return


if __name__ == "__main__":
    app.run()
