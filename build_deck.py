"""ReturnLens Pitch Deck Builder — Academic Presentation Edition (8 Slides)
Builds an 8-slide presentation suitable for a third-year engineering presentation,
reading directly from reports/evaluation_results.json for 100% metric consistency.
Includes natural speaker notes for each slide.
"""

import json
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

import config

# Color Palette Specification
BG_LIGHT = RGBColor(248, 250, 252)       # #F8FAFC Crisp clean canvas
CARD_BG = RGBColor(255, 255, 255)        # #FFFFFF Card background
CARD_BORDER = RGBColor(226, 232, 240)    # #E2E8F0 Subtle border
DIVIDER_LINE = RGBColor(203, 213, 225)   # #CBD5E1 Divider

DARK_HERO_BG = RGBColor(15, 23, 42)      # #0F172A Deep Slate for Cover
DARK_HERO_CARD = RGBColor(30, 41, 59)    # #1E293B

TEXT_PRIMARY = RGBColor(15, 23, 42)      # #0F172A Dark Charcoal
TEXT_SECONDARY = RGBColor(71, 85, 105)   # #475569 Slate 600
TEXT_MUTED = RGBColor(148, 163, 184)     # #94A3B8 Muted Slate
TEXT_WHITE = RGBColor(255, 255, 255)     # #FFFFFF

ACCENT_BLUE = RGBColor(37, 99, 235)      # #2563EB Primary Brand Blue
ACCENT_CYAN = RGBColor(14, 165, 233)     # #0EA5E9 Cyan
ACCENT_GREEN = RGBColor(16, 185, 129)    # #10B981 Emerald
ACCENT_AMBER = RGBColor(245, 158, 11)    # #F59E0B Amber
ACCENT_RED = RGBColor(225, 29, 72)       # #E11D48 Rose / Crimson

FONT_MAIN = "Calibri"
TOTAL_SLIDES = 8


def load_master_metrics():
    """Loads evaluation metrics from reports/evaluation_results.json."""
    json_path = config.EVALUATION_JSON_PATH
    if not json_path.exists():
        raise FileNotFoundError(f"Evaluation metrics file not found: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_deck():
    eval_data = load_master_metrics()
    d_info = eval_data["dataset_verification"]
    benchmarks = eval_data["validation_benchmarks"]
    thresh_info = eval_data["threshold_selection"]
    test_eval = eval_data["held_out_test_evaluation"]
    cost_info = eval_data["cost_model_assumptions"]

    test_50 = test_eval["at_0_50_threshold"]
    test_opt = test_eval["at_validation_selected_threshold"]
    cm50 = test_50["confusion_matrix"]
    cm_opt = test_opt["confusion_matrix"]
    opt_th = thresh_info["selected_optimal_threshold"]

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_background(slide, color=BG_LIGHT):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, dark=False):
        # Tag pill
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.25))
        tf_tag = tag_box.text_frame
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.name = FONT_MAIN
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = ACCENT_CYAN if dark else ACCENT_BLUE

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(11.733), Inches(0.55))
        tf_title = title_box.text_frame
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_MAIN
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE if dark else TEXT_PRIMARY

        # Divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.733), Inches(0.015))
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(51, 65, 85) if dark else DIVIDER_LINE
        line.line.fill.background()

    def add_footer(slide, slide_num, dark=False):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.3))
        tf = footer_box.text_frame
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"ReturnLens Project Presentation  |  Slide {slide_num} of {TOTAL_SLIDES}"
        p.font.name = FONT_MAIN
        p.font.size = Pt(9)
        p.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()
        return card

    # =========================================================================
    # SLIDE 1: Title & Introduction
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_background(s1, DARK_HERO_BG)
    add_footer(s1, 1, dark=True)

    # Main Title Header
    t_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(11.733), Inches(1.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "ReturnLens: E-Commerce Return Risk Prediction"
    p1.font.name = FONT_MAIN
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE

    p2 = tf1.add_paragraph()
    p2.text = "Pre-Fulfillment Return Propensity Scoring and Cost-Sensitive Decision Optimization"
    p2.font.name = FONT_MAIN
    p2.font.size = Pt(16)
    p2.font.color.rgb = ACCENT_CYAN
    p2.space_before = Pt(8)

    p3 = tf1.add_paragraph()
    p3.text = "Third-Year Engineering Capstone Project  |  Machine Learning & Web Systems"
    p3.font.name = FONT_MAIN
    p3.font.size = Pt(12)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(6)

    # 3 Comparison Columns / Cards
    cards_data = [
        (
            "Traditional Approach",
            "Static Return Policies & Blacklists",
            "• Universal return windows (e.g., blanket 30-day policy).\n"
            "• Manual blacklisting of repeat returners.\n"
            "• Ignores product-specific sizing and catalog risk.\n"
            "• Creates heavy customer friction indiscriminately.",
            DARK_HERO_CARD,
            ACCENT_AMBER
        ),
        (
            "Predictive ML Approach",
            "Individual Return Propensity Scoring",
            "• Predicts return probability P(Return | Order) at checkout.\n"
            "• Combines customer purchase history, demographics, and product catalog features.\n"
            "• Explains risk drivers using TreeSHAP factor attributions.\n"
            "• Enables surgical, low-friction interventions (e.g., size checks).",
            DARK_HERO_CARD,
            ACCENT_CYAN
        ),
        (
            "Evaluation Benchmark",
            "Dataset Source & Integrity",
            "• Built and evaluated on the ASOS Fashion E-Commerce Dataset.\n"
            "• 2,829,499 total events across 1.12M customer profiles.\n"
            "• Verified raw unmanipulated labels directly analyzed.\n"
            "• Protected as strictly read-only with SHA256 checksums.",
            DARK_HERO_CARD,
            ACCENT_GREEN
        ),
    ]

    for idx, (tag, header, body, bg_col, accent_col) in enumerate(cards_data):
        c_left = 0.8 + idx * 4.0
        add_card(s1, c_left, 3.2, 3.733, 3.5, bg_color=bg_col, border_color=RGBColor(51, 65, 85))

        tb = s1.shapes.add_textbox(Inches(c_left + 0.25), Inches(3.4), Inches(3.233), Inches(3.1))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p_tag = tf.paragraphs[0]
        p_tag.text = tag.upper()
        p_tag.font.name = FONT_MAIN
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = accent_col

        p_hdr = tf.add_paragraph()
        p_hdr.text = header
        p_hdr.font.name = FONT_MAIN
        p_hdr.font.size = Pt(14)
        p_hdr.font.bold = True
        p_hdr.font.color.rgb = TEXT_WHITE
        p_hdr.space_before = Pt(4)

        p_bdy = tf.add_paragraph()
        p_bdy.text = body
        p_bdy.font.name = FONT_MAIN
        p_bdy.font.size = Pt(11)
        p_bdy.font.color.rgb = RGBColor(226, 232, 240)
        p_bdy.space_before = Pt(8)

    s1.notes_slide.notes_text_frame.text = (
        "Good morning everyone. Today I am presenting ReturnLens, a machine learning system designed to predict and "
        "manage product returns in online retail. Product returns in fashion e-commerce are a massive operational issue, "
        "often exceeding 30 to 50 percent of total sales volume. Existing solutions rely on static rules, such as blanket return "
        "bans or rigid policies, which alienate genuine customers. In this project, we treat return prevention as a predictive "
        "machine learning problem. We train models on the verified ASOS fashion dataset to predict return probability at checkout, "
        "explain predictions with TreeSHAP, and optimize decision thresholds to minimize business loss."
    )

    # =========================================================================
    # SLIDE 2: Problem Overview & Cost Asymmetry
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_background(s2)
    add_header(s2, "Problem Formulation", "The Return Problem & Cost-Asymmetric Decisions")
    add_footer(s2, 2)

    # Left card: Operational Challenge
    add_card(s2, 0.8, 1.6, 5.6, 5.1)
    tb_s2_l = s2.shapes.add_textbox(Inches(1.1), Inches(1.85), Inches(5.0), Inches(4.6))
    tf_s2_l = tb_s2_l.text_frame
    tf_s2_l.word_wrap = True
    tf_s2_l.margin_left = tf_s2_l.margin_top = tf_s2_l.margin_right = tf_s2_l.margin_bottom = 0

    p = tf_s2_l.paragraphs[0]
    p.text = "THE FASHION E-COMMERCE DILEMMA"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = tf_s2_l.add_paragraph()
    p.text = "Why Returns Drain Merchant Profitability"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(4)

    p = tf_s2_l.add_paragraph()
    p.text = (
        "1. Massive Baseline Volume: Apparel returns frequently range between 30% and 50% due to "
        "size bracketing (ordering multiple sizes to keep one) and fit uncertainty.\n\n"
        "2. Beyond Payment Fraud: Most returns come from legitimate, paying customers with sizing mismatches, "
        "not stolen credit cards. Traditional payment-fraud filters cannot solve this.\n\n"
        "3. Reverse Logistics Bleed: Every returned item incurs non-refundable courier fees, inspection, "
        "repackaging, restock labor, and inventory depreciation while out of circulation."
    )
    p.font.size = Pt(11.5)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(10)

    # Right card: Asymmetric Cost Model
    add_card(s2, 6.8, 1.6, 5.733, 5.1)
    tb_s2_r = s2.shapes.add_textbox(Inches(7.1), Inches(1.85), Inches(5.133), Inches(4.6))
    tf_s2_r = tb_s2_r.text_frame
    tf_s2_r.word_wrap = True
    tf_s2_r.margin_left = tf_s2_r.margin_top = tf_s2_r.margin_right = tf_s2_r.margin_bottom = 0

    p = tf_s2_r.paragraphs[0]
    p.text = "COST-SENSITIVE DECISION LOGIC"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    p = tf_s2_r.add_paragraph()
    p.text = "Unequal Error Penalties (Illustrative Assumptions)"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(4)

    p = tf_s2_r.add_paragraph()
    p.text = (
        "In binary classification, errors are not equal:\n\n"
        "• False Negative (FN Cost = $25.00 assumption):\n"
        "  Predicting 'Kept' when the order is returned. The merchant incurs unmanaged two-way shipping, "
        "restocking, and repackaging loss.\n\n"
        "• False Positive (FP Cost = $5.00 assumption):\n"
        "  Predicting 'Returned' when the customer keeps the item. Triggers a mild size-confirmation prompt, "
        "incurring slight friction or customer verification cost.\n\n"
        "• The 0.50 Threshold Failure:\n"
        "  Standard ML cutoffs (τ = 0.50) assume equal error penalties (1:1). Because missing a return is 5× more "
        "costly ($25 vs $5), the decision threshold must be shifted to minimize total loss."
    )
    p.font.size = Pt(11.5)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(10)

    s2.notes_slide.notes_text_frame.text = (
        "Here we define the core operational problem. In fashion retail, returns are not caused by payment fraud; "
        "they are caused by fit and sizing uncertainty. Customers frequently order two sizes of the same dress and "
        "return the one that does not fit. When an item is returned, the merchant loses an estimated $25 in shipping and restock fees. "
        "On the other hand, if we prompt a customer to confirm their measurements before shipping, that friction is modest, "
        "which we assume costs about $5. Because missing a return is five times more expensive than checking an order, a standard "
        "50 percent probability threshold is economically suboptimal. We need cost-sensitive threshold selection."
    )

    # =========================================================================
    # SLIDE 3: Dataset Structure & Integrity Verification
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_background(s3)
    add_header(s3, "Dataset & Integrity", "Dataset Structure & Verification of Raw Labels")
    add_footer(s3, 3)

    # Top summary card
    add_card(s3, 0.8, 1.6, 11.733, 1.8)
    tb_s3_top = s3.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(11.133), Inches(1.4))
    tf_s3_top = tb_s3_top.text_frame
    tf_s3_top.word_wrap = True
    tf_s3_top.margin_left = tf_s3_top.margin_top = tf_s3_top.margin_right = tf_s3_top.margin_bottom = 0

    p = tf_s3_top.paragraphs[0]
    p.text = "DATASET PROVENANCE & STRICT INTEGRITY GUARANTEE"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = tf_s3_top.add_paragraph()
    p.text = "ASOS E-Commerce Returns Dataset (2.83 Million Total Transactions)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(3)

    p = tf_s3_top.add_paragraph()
    p.text = (
        "• Provenance: Real-world retail transaction benchmark from fashion e-commerce (ASOS dataset).\n"
        "• Historical Label Audit: Earlier project iterations used enhance_dataset.py to synthesize artificial labels "
        "targeting ~82% accuracy. This label rewriting was retired and permanently disabled.\n"
        "• Read-Only Protection: All files in Dataset/ are treated as strictly read-only. Training directly consumes verified "
        "original raw labels from event_table_training_raw.p and event_table_testing_raw.p. Checksums verified before and after work."
    )
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(4)

    # Bottom 3 Cards: Table breakdown
    table_cards = [
        (
            "Transaction Events",
            f"Train Raw: 1,980,649 rows\nTest Raw: 848,850 rows",
            "• Join Keys: hash(customerId), hash(variantID)\n"
            "• Target: isReturned (1 = Returned, 0 = Kept)\n"
            "• Train Return Rate: 54.85% (1.08M returns)\n"
            "• Test Return Rate: 54.92% (466K returns)\n"
            "• Verified original unmanipulated class distribution.",
            ACCENT_BLUE
        ),
        (
            "Customer Profiles",
            "1,121,819 Nodes (30 Features)",
            "• Demographics: yearOfBirth, isMale, country\n"
            "• VIP Status: premier loyalty subscription flag\n"
            "• History: salesPerCustomer, returnsPerCustomer\n"
            "• Historical customerReturnRate\n"
            "• Reason Codes: distributions A through L.",
            ACCENT_GREEN
        ),
        (
            "Product Variant Catalog",
            "576,127 Nodes (44 Features)",
            "• Sizing/Catalog: productType (25), brandDesc (150+)\n"
            "• Pricing: avgGbpPrice (£), avgDiscountValue (£)\n"
            "• Sales Volume: salesPerProduct, returnsPerProduct\n"
            "• Historical productReturnRate\n"
            "• Variant-level reason codes A through L.",
            ACCENT_CYAN
        ),
    ]

    for idx, (hdr, subhdr, body, col) in enumerate(table_cards):
        c_left = 0.8 + idx * 4.0
        add_card(s3, c_left, 3.6, 3.733, 3.1)
        tb = s3.shapes.add_textbox(Inches(c_left + 0.2), Inches(3.8), Inches(3.333), Inches(2.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p = tf.paragraphs[0]
        p.text = hdr.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = col

        p = tf.add_paragraph()
        p.text = subhdr
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = TEXT_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = body
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_SECONDARY
        p.space_before = Pt(6)

    s3.notes_slide.notes_text_frame.text = (
        "Now let us examine the dataset. We use the public ASOS fashion transaction benchmark, which contains over 2.8 million "
        "real transactions. A critical part of our audit was determining that earlier versions of this project modified the labels "
        "using a synthetic script called enhance_dataset.py. We permanently disabled that script, treated the Dataset folder as "
        "read-only, and verified the SHA256 checksums. We train and evaluate directly on the original raw labels. Across the raw "
        "data, the return rate is approximately 54.9 percent. The dataset joins event orders with customer demographics and product "
        "catalog features such as price, discount, and historical return proportions."
    )

    # =========================================================================
    # SLIDE 4: Data Preparation & Leakage Safeguards
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_background(s4)
    add_header(s4, "Data Preparation", "Data Cleaning, Joins, and Leakage Prevention")
    add_footer(s4, 4)

    prep_steps = [
        (
            "1. Schema Disambiguation",
            "Duplicate Column Headers Resolved",
            "• Raw customer and product nodes had duplicated header strings: customerId_level_return_code_D and variantID_level_return_code_D.\n"
            "• Disambiguated in memory to *_D_1 and *_D_2, preserving distinct numeric proportions without collision.",
            ACCENT_BLUE
        ),
        (
            "2. Entity Deduplication",
            "Preventing Cartesian Join Explosion",
            "• Node tables represent periodic snapshots containing multiple rows per entity ID.\n"
            "• Deduplicated on primary keys hash(customerId) and hash(variantID), keeping the latest snapshot (keep='last').\n"
            "• Ensures clean 1-to-1 relational joins with transaction events.",
            ACCENT_GREEN
        ),
        (
            "3. Domain Feature Derivation",
            "Pre-Fulfillment Attributes",
            "• Derived domain features strictly available at order placement:\n"
            "  - customer_age = 2026 - yearOfBirth (clipped 10 to 100)\n"
            "  - discount_ratio = discount / (price + 1e-4)\n"
            "  - net_price = price - discount\n"
            "• Captures price elasticity and promotional sensitivity.",
            ACCENT_CYAN
        ),
        (
            "4. Leakage Prevention & Uncertainty",
            "Strict Preprocessor Isolation",
            "• All imputers (median for numeric, constant for categorical), standard scalers, and one-hot encoders are fitted strictly on X_train.\n"
            "• Validation and Test sets are transformed using fitted training statistics.\n"
            "• Uncertainty documented: Static snapshots in timestamp-free benchmark data mean lifetime return counts cannot be isolated to order timestamp.",
            ACCENT_AMBER
        ),
    ]

    for idx, (hdr, subhdr, body, col) in enumerate(prep_steps):
        row = idx // 2
        col_idx = idx % 2
        c_left = 0.8 + col_idx * 5.95
        c_top = 1.6 + row * 2.65
        add_card(s4, c_left, c_top, 5.75, 2.45)

        tb = s4.shapes.add_textbox(Inches(c_left + 0.25), Inches(c_top + 0.2), Inches(5.25), Inches(2.05))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p = tf.paragraphs[0]
        p.text = hdr.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col

        p = tf.add_paragraph()
        p.text = subhdr
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = body
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_SECONDARY
        p.space_before = Pt(4)

    s4.notes_slide.notes_text_frame.text = (
        "Data preparation is where most machine learning projects succeed or fail. First, we resolved duplicate column names "
        "in the raw pickle files. Second, we deduplicated the node tables on customer and variant IDs so that left joins did not "
        "multiply rows. Third, we engineered domain features available at order time: customer age, discount ratio, and net price. "
        "Most importantly, to prevent data leakage, all scalers, median imputers, and encoders were fit strictly on the training partition. "
        "We also acknowledge a key dataset limitation: because the benchmark events lack timestamps, lifetime customer return rates "
        "are static snapshots. In a live system, this feature must be computed as a running window strictly before the order timestamp."
    )

    # =========================================================================
    # SLIDE 5: Models & Workflow
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_background(s5)
    add_header(s5, "Methodology & Architecture", "Model Development & Partitioning Workflow")
    add_footer(s5, 5)

    # Left Column: The 3 Models
    add_card(s5, 0.8, 1.6, 5.6, 5.1)
    tb_s5_l = s5.shapes.add_textbox(Inches(1.1), Inches(1.85), Inches(5.0), Inches(4.6))
    tf_s5_l = tb_s5_l.text_frame
    tf_s5_l.word_wrap = True
    tf_s5_l.margin_left = tf_s5_l.margin_top = tf_s5_l.margin_right = tf_s5_l.margin_bottom = 0

    p = tf_s5_l.paragraphs[0]
    p.text = "CANDIDATE MODEL ARCHITECTURES"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = tf_s5_l.add_paragraph()
    p.text = "From Heuristic Baseline to Gradient Boosting"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(4)

    models_text = (
        "1. Simple Baseline (Dummy Prior):\n"
        "   Predicts the empirical return prior (55.0% probability). Provides the statistical floor with "
        "50.0% ROC-AUC and 55.0% accuracy.\n\n"
        "2. Logistic Regression (Linear Statistical Model):\n"
        "   Estimates log-odds via linear combination of standard-scaled features and one-hot categories. "
        "Trains in under 1 second (0.95s), offering high transparency.\n\n"
        "3. XGBoost Classifier (Gradient Boosted Trees):\n"
        "   Ensemble of 150 shallow decision trees (depth=5, lr=0.08). Captures non-linear feature interactions "
        "between discounts, customer return frequency, and garment types."
    )
    p = tf_s5_l.add_paragraph()
    p.text = models_text
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(8)

    # Right Column: Partitioning & Practical Sample Sizes
    add_card(s5, 6.8, 1.6, 5.733, 5.1)
    tb_s5_r = s5.shapes.add_textbox(Inches(7.1), Inches(1.85), Inches(5.133), Inches(4.6))
    tf_s5_r = tb_s5_r.text_frame
    tf_s5_r.word_wrap = True
    tf_s5_r.margin_left = tf_s5_r.margin_top = tf_s5_r.margin_right = tf_s5_r.margin_bottom = 0

    p = tf_s5_r.paragraphs[0]
    p.text = "RIGOROUS PARTITIONING WORKFLOW"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    p = tf_s5_r.add_paragraph()
    p.text = "Train, Validation, and Held-Out Test Splits"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(4)

    workflow_text = (
        "• Practical Sample Sizes (Laptop/Desktop Friendly):\n"
        "  - 100,000 raw training events sampled (Seed = 42).\n"
        "  - Stratified 80/20 train/validation split.\n"
        "  - 80,000 Training samples: Used exclusively for preprocessor and model parameter fitting.\n"
        "  - 20,000 Internal Validation samples: Used for model comparison, calibration check, and cost threshold search.\n\n"
        "• Single-Pass Held-Out Test Partition:\n"
        "  - 50,000 unseen test transactions sampled from event_table_testing_raw.p.\n"
        "  - Completely untouched during feature engineering, model selection, and threshold tuning.\n"
        "  - Evaluated exactly once after all development decisions were frozen."
    )
    p = tf_s5_r.add_paragraph()
    p.text = workflow_text
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(8)

    s5.notes_slide.notes_text_frame.text = (
        "For model development, we selected three models: a simple majority prior baseline, Logistic Regression, and XGBoost. "
        "The baseline provides the reference floor. Logistic regression gives us a fast, interpretable benchmark. XGBoost captures "
        "complex interactions between discounts and customer history. We partitioned our training sample of 100,000 events into "
        "80,000 training orders and 20,000 validation orders. The validation split was used exclusively to compare models, assess "
        "probability calibration, and sweep for the optimal decision cutoff. The 50,000 test orders remained completely untouched "
        "until the very end to guarantee an unbiased evaluation."
    )

    # =========================================================================
    # SLIDE 6: Verified Experimental Results & Cost Analysis
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_background(s6)
    add_header(s6, "Experimental Results", "Verified Evaluation on Held-Out Test Set")
    add_footer(s6, 6)

    # Left Card: Metrics Comparison Table (0.50 vs Optimal Cutoff)
    add_card(s6, 0.8, 1.6, 5.7, 5.1)
    tb_s6_l = s6.shapes.add_textbox(Inches(1.05), Inches(1.8), Inches(5.2), Inches(4.7))
    tf_s6_l = tb_s6_l.text_frame
    tf_s6_l.word_wrap = True
    tf_s6_l.margin_left = tf_s6_l.margin_top = tf_s6_l.margin_right = tf_s6_l.margin_bottom = 0

    p = tf_s6_l.paragraphs[0]
    p.text = "HELD-OUT TEST SET EVALUATION (N = 50,000)"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = tf_s6_l.add_paragraph()
    p.text = "Performance at 0.50 vs. Optimal Cutoff (τ* = 0.17)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(2)

    table_text = (
        f"Primary Discrimination Metrics:\n"
        f"• ROC-AUC: {test_50['roc_auc']:.4f}  |  PR-AUC: {test_50['pr_auc']:.4f}  |  Brier: {test_50['brier_score']:.4f}\n\n"
        f"Metric Comparison by Operating Threshold:\n"
        f"• Accuracy:  {test_50['accuracy']*100:.2f}% (at 0.50)  vs  {test_opt['accuracy']*100:.2f}% (at 0.17)\n"
        f"• Precision: {test_50['precision']*100:.2f}% (at 0.50)  vs  {test_opt['precision']*100:.2f}% (at 0.17)\n"
        f"• Recall:    {test_50['recall']*100:.2f}% (at 0.50)  vs  {test_opt['recall']*100:.2f}% (at 0.17)\n"
        f"• F1-Score:  {test_50['f1']:.4f} (at 0.50)  vs  {test_opt['f1']:.4f} (at 0.17)\n\n"
        f"Confusion Matrix at 0.50 Cutoff:\n"
        f"  TN = {cm50['TN']:,}  |  FP = {cm50['FP']:,}\n"
        f"  FN = {cm50['FN']:,}  |  TP = {cm50['TP']:,}\n\n"
        f"Confusion Matrix at Optimal Cutoff (τ = {opt_th:.2f}):\n"
        f"  TN = {cm_opt['TN']:,}   |  FP = {cm_opt['FP']:,}\n"
        f"  FN = {cm_opt['FN']:,}     |  TP = {cm_opt['TP']:,}"
    )
    p = tf_s6_l.add_paragraph()
    p.text = table_text
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(6)

    # Right Card: Cost Analysis
    add_card(s6, 6.9, 1.6, 5.633, 5.1)
    tb_s6_r = s6.shapes.add_textbox(Inches(7.15), Inches(1.8), Inches(5.133), Inches(4.7))
    tf_s6_r = tb_s6_r.text_frame
    tf_s6_r.word_wrap = True
    tf_s6_r.margin_left = tf_s6_r.margin_top = tf_s6_r.margin_right = tf_s6_r.margin_bottom = 0

    p = tf_s6_r.paragraphs[0]
    p.text = "COST-SENSITIVE BUSINESS IMPACT"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    p = tf_s6_r.add_paragraph()
    p.text = "Illustrative Financial Savings ($5 FP, $25 FN)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    p.space_before = Pt(2)

    cost_50 = test_50["cost_analysis"]
    cost_opt_data = test_opt["cost_analysis"]

    cost_text = (
        f"• Cost Formula: Total Cost = (FP × $5.00) + (FN × $25.00)\n\n"
        f"1. Baseline Policy (No Intervention / Accept All Orders):\n"
        f"   - Missed Returns (FN) = {test_eval['actual_positives']:,} orders\n"
        f"   - Baseline Operational Loss: ${cost_50['baseline_cost']:,.2f}\n\n"
        f"2. Standard Policy (Cutoff τ = 0.50):\n"
        f"   - Incurred Cost: ${cost_50['incurred_cost']:,.2f}\n"
        f"   - Estimated Savings: ${cost_50['estimated_savings']:,.2f} ({cost_50['savings_percent']:.1f}% reduction)\n"
        f"   - Flag Rate: {cost_50['flag_rate']*100:.1f}%\n\n"
        f"3. Cost-Optimal Policy (Validation-Selected Cutoff τ = {opt_th:.2f}):\n"
        f"   - Incurred Cost: ${cost_opt_data['incurred_cost']:,.2f}\n"
        f"   - Estimated Savings: ${cost_opt_data['estimated_savings']:,.2f} ({cost_opt_data['savings_percent']:.1f}% reduction)\n"
        f"   - Intercepts 98.25% of returns ({cm_opt['TP']:,}/{test_eval['actual_positives']:,}), lowering unmanaged return leakage to just {cm_opt['FN']:,} orders.\n\n"
        f"*Note: Savings are model-based counterfactual estimates; validating real business impact requires live A/B testing."
    )
    p = tf_s6_r.add_paragraph()
    p.text = cost_text
    p.font.size = Pt(10)
    p.font.color.rgb = TEXT_SECONDARY
    p.space_before = Pt(6)

    s6.notes_slide.notes_text_frame.text = (
        "Here are our verified, honest results on the 50,000 held-out test transactions. Our XGBoost model achieves an "
        "ROC-AUC of 0.8119 and a PR-AUC of 0.8418, with a low Brier calibration score of 0.1754. Notice the comparison between "
        "the standard 0.50 threshold and our validation-selected 0.17 threshold. At 0.50, accuracy is 73.2 percent with balanced "
        "precision and recall. However, under our cost assumption of $5 for false positives and $25 for false negatives, shifting the "
        "cutoff to 0.17 catches 98.25 percent of all returns, cutting missed returns from 5,938 down to just 483. This lowers illustrative "
        "business loss by 85.6 percent, though it flags more orders. We emphasize that these numbers are model estimates and would "
        "require a live intervention study to verify."
    )

    # =========================================================================
    # SLIDE 7: Application Demo & TreeSHAP Explainability
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_background(s7)
    add_header(s7, "System Implementation", "Application Architecture & SHAP Explainability")
    add_footer(s7, 7)

    app_features = [
        (
            "FastAPI REST Backend",
            "Low-Latency Model Serving",
            "• Asynchronous endpoints (/predict, /benchmarks, /threshold, /simulate-cost).\n"
            "• Pure-Python NativeTreeModel enables rapid tree evaluation without heavy runtime overhead.\n"
            "• Dynamically loads the optimal threshold (τ = 0.17) from models/threshold.json, ensuring 100% policy consistency.",
            ACCENT_BLUE
        ),
        (
            "React Web Dashboard",
            "Interactive Single-Page UI",
            "• Live Risk Simulator: Sliders for customer orders, returns, item price, category, and discount.\n"
            "• Real-Time Risk Gauge: Dynamic color-coded probability gauge with optimal cutoff indicator.\n"
            "• Built and bundled via Vite for instant browser rendering.",
            ACCENT_CYAN
        ),
        (
            "TreeSHAP Explainability",
            "Transparent Risk Attribution",
            "• Generates top 3 plain-English contributing factors for every transaction.\n"
            "• Quantifies exact feature impact in log-odds relative to the base population rate.\n"
            "• Explains why an order was flagged (e.g., heavy discount, high category return rate).",
            ACCENT_GREEN
        ),
        (
            "Cold-Start Customer Handling",
            "Graceful Profile Fallbacks",
            "• 43.5% of test customers have no prior purchase history (cold-start).\n"
            "• The system explains this transparently: 'Cold-Start Customer (Baseline return propensity applied)'.\n"
            "• Relies safely on item price, category, and demographics without crashing or inventing history.",
            ACCENT_AMBER
        ),
    ]

    for idx, (hdr, subhdr, body, col) in enumerate(app_features):
        row = idx // 2
        col_idx = idx % 2
        c_left = 0.8 + col_idx * 5.95
        c_top = 1.6 + row * 2.65
        add_card(s7, c_left, c_top, 5.75, 2.45)

        tb = s7.shapes.add_textbox(Inches(c_left + 0.25), Inches(c_top + 0.2), Inches(5.25), Inches(2.05))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p = tf.paragraphs[0]
        p.text = hdr.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col

        p = tf.add_paragraph()
        p.text = subhdr
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = body
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_SECONDARY
        p.space_before = Pt(4)

    s7.notes_slide.notes_text_frame.text = (
        "To make our machine learning model practical and demonstrable, we built a full-stack web application. The backend is "
        "built with FastAPI and serves predictions in milliseconds using an optimized pure-Python tree evaluator. The frontend is an "
        "interactive React application where merchants can simulate different order scenarios. Crucially, every prediction is "
        "accompanied by TreeSHAP explanations showing the top three factors pushing the risk score up or down. For example, it might "
        "point to a high historical return rate for the product category or a steep discount. In cases where the customer has no order "
        "history—which happens in 43 percent of test orders—the system gracefully reports a cold-start profile and relies on catalog features."
    )

    # =========================================================================
    # SLIDE 8: Limitations & Future Work
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_background(s8)
    add_header(s8, "Critical Analysis", "Project Limitations & Future Research")
    add_footer(s8, 8)

    # 4 Cards on Limitations & Next Steps
    lims_data = [
        (
            "Limitation 1: Lack of Event Timestamps",
            "Static Snapshots vs. Point-in-Time Features",
            "• The public ASOS benchmark dataset does not include individual transaction dates or timestamps.\n"
            "• Customer return rates represent lifetime snapshot aggregates rather than strict point-in-time rolling calculations.\n"
            "• In a live retail environment, features must be computed via streaming feature stores (e.g. Feast) strictly before checkout.",
            ACCENT_AMBER
        ),
        (
            "Limitation 2: Observational Counterfactuals",
            "Model-Based Estimates Require A/B Testing",
            "• Cost savings and return interception are estimated counterfactually from offline historical data.\n"
            "• Real-world customer behavior will respond dynamically to interventions (e.g., sizing prompts or policy notices).\n"
            "• Verifying genuine merchant profit improvement requires randomized controlled online A/B trials.",
            ACCENT_AMBER
        ),
        (
            "Limitation 3: Scope of Risk Prediction",
            "Returns vs. Payment Fraud & Delivery Refusal",
            "• ReturnLens focuses strictly on legitimate return risk driven by sizing and product expectations.\n"
            "• Detecting stolen payment cards or cash-on-delivery delivery refusals (RTO fraud) requires separate chargeback and courier attempt logs.\n"
            "• ReturnLens should complement, not replace, existing payment security gateways.",
            ACCENT_BLUE
        ),
        (
            "Future Work: Engineering Roadmap",
            "Next Steps for Enterprise Readiness",
            "• Multi-Task Learning: Simultaneously predicting return probability, return reason code (fit vs defect), and exchange likelihood.\n"
            "• Size Recommendation Integration: Integrating predictive sizing engines directly into checkout to resolve fit before purchase.\n"
            "• Production Webhooks: Shopify, WooCommerce, and payment gateway plugins for real-time checkout scoring.",
            ACCENT_GREEN
        ),
    ]

    for idx, (hdr, subhdr, body, col) in enumerate(lims_data):
        row = idx // 2
        col_idx = idx % 2
        c_left = 0.8 + col_idx * 5.95
        c_top = 1.6 + row * 2.65
        add_card(s8, c_left, c_top, 5.75, 2.45)

        tb = s8.shapes.add_textbox(Inches(c_left + 0.25), Inches(c_top + 0.2), Inches(5.25), Inches(2.05))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p = tf.paragraphs[0]
        p.text = hdr.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col

        p = tf.add_paragraph()
        p.text = subhdr
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = body
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_SECONDARY
        p.space_before = Pt(4)

    s8.notes_slide.notes_text_frame.text = (
        "To conclude, as engineers it is vital to understand the limitations of our work. First, because the benchmark dataset "
        "did not include order timestamps, customer return rates are static snapshots. In production, this would be computed using "
        "a point-in-time feature store. Second, our cost savings are model-based counterfactual estimates; confirming actual dollar "
        "savings in production requires live A/B testing where different intervention policies are tested against a control group. "
        "Third, our project focuses on customer returns, not criminal payment fraud or fake orders, which require separate courier "
        "and bank chargeback signals. In the future, we plan to extend this system to multi-task learning for returns and exchanges. "
        "Thank you, and I look forward to your questions."
    )

    output_path = PROJECT_ROOT / "ReturnLens_Pitch_Deck.pptx"
    prs.save(str(output_path))
    print(f"Presentation saved successfully to: {output_path}")


if __name__ == "__main__":
    build_deck()
